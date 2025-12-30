// pages/api/paystack/webhook.js
// 🔒 PAYSTACK WEBHOOK – SERVER ONLY
// Handles:
// - Provider activation payment
// - Subscription upgrades (basic / premium)
// - Signature verification (required)

import crypto from "crypto";
import { supabase } from "../../../lib/supabaseClient";

export const config = {
  api: {
    bodyParser: false, // REQUIRED for Paystack signature verification
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).end("Method Not Allowed");
  }

  try {
    // 1️⃣ Read raw body
    const rawBody = await getRawBody(req);

    // 2️⃣ Verify Paystack signature
    const paystackSignature = req.headers["x-paystack-signature"];
    const expectedSignature = crypto
      .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
      .update(rawBody)
      .digest("hex");

    if (paystackSignature !== expectedSignature) {
      console.error("❌ Invalid Paystack signature");
      return res.status(401).end("Invalid signature");
    }

    // 3️⃣ Parse event
    const event = JSON.parse(rawBody.toString());

    // We only care about successful charges
    if (event.event !== "charge.success") {
      return res.status(200).json({ received: true });
    }

    const data = event.data;
    const metadata = data?.metadata || {};

    const userId = metadata.user_id;
    const paymentType = metadata.payment_type; // activation | basic | premium

    if (!userId || !paymentType) {
      console.error("❌ Missing metadata:", metadata);
      return res.status(400).end("Missing metadata");
    }

    /**
     * 4️⃣ Handle payment types
     */
    if (paymentType === "activation") {
      const { error } = await supabase
        .from("profiles")
        .update({
          activation_paid: true,
        })
        .eq("id", userId);

      if (error) {
        console.error("❌ Activation update failed:", error);
        return res.status(500).end("Activation update failed");
      }
    }

    if (paymentType === "basic" || paymentType === "premium") {
      const { error } = await supabase
        .from("profiles")
        .update({
          subscription_plan: paymentType,
        })
        .eq("id", userId);

      if (error) {
        console.error("❌ Subscription update failed:", error);
        return res.status(500).end("Subscription update failed");
      }
    }

    // ✅ All good
    return res.status(200).json({ received: true });
  } catch (err) {
    console.error("❌ Paystack webhook error:", err);
    return res.status(500).end("Webhook processing error");
  }
}

/**
 * Helper: Read raw request body
 */
function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = [];
    req.on("data", (chunk) => data.push(chunk));
    req.on("end", () => resolve(Buffer.concat(data)));
    req.on("error", reject);
  });
}