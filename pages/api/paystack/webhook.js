// 🔒 PAYSTACK WEBHOOK – SERVER ONLY (HARDENED)
// Handles:
// - Provider activation payment
// - Subscription upgrades (basic / premium)
// - Amount → plan verification (SECURE)
// - Automatic 30-day expiry
// - Automatic downgrade cleanup
// - Signature verification (REQUIRED)

import crypto from "crypto";
import { supabase } from "../../../lib/supabaseClient";

/**
 * 🔐 AMOUNTS (KOBO) — SINGLE SOURCE OF TRUTH
 * ⚠️ Change values here ONLY
 */
const ACTIVATION_AMOUNT = 500000; // ₦5,000
const BASIC_AMOUNT = 1000000;     // ₦10,000
const PREMIUM_AMOUNT = 2000000;   // ₦20,000

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

    // Only care about successful charges
    if (event.event !== "charge.success") {
      return res.status(200).json({ received: true });
    }

    const data = event.data;
    const metadata = data?.metadata || {};

    const userId = metadata.user_id;
    const amountPaid = Number(data.amount); // KOBO

    if (!userId || !amountPaid) {
      console.error("❌ Missing userId or amount:", { userId, amountPaid });
      return res.status(400).end("Invalid payload");
    }

    /**
     * 4️⃣ DETERMINE PAYMENT TYPE FROM AMOUNT (SECURE)
     */
    let paymentType = null;

    if (amountPaid === ACTIVATION_AMOUNT) {
      paymentType = "activation";
    } else if (amountPaid === BASIC_AMOUNT) {
      paymentType = "basic";
    } else if (amountPaid === PREMIUM_AMOUNT) {
      paymentType = "premium";
    } else {
      console.error("❌ Invalid payment amount:", amountPaid);
      return res.status(400).end("Invalid payment amount");
    }

    /**
     * 5️⃣ Handle activation
     */
    if (paymentType === "activation") {
      const { error } = await supabase
        .from("profiles")
        .update({ activation_paid: true })
        .eq("id", userId);

      if (error) {
        console.error("❌ Activation update failed:", error);
        return res.status(500).end("Activation update failed");
      }
    }

    /**
     * 6️⃣ Handle subscription (basic / premium)
     */
    if (paymentType === "basic" || paymentType === "premium") {
      const expiresAt = new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 days
      );

      const { error } = await supabase
        .from("profiles")
        .update({
          subscription_plan: paymentType,
          subscription_expires_at: expiresAt,
        })
        .eq("id", userId);

      if (error) {
        console.error("❌ Subscription update failed:", error);
        return res.status(500).end("Subscription update failed");
      }

      // 🔄 AUTO-DOWNGRADE CLEANUP (NO MANUAL ACTION)
      await supabase.rpc("downgrade_expired_subscriptions");
    }

    // ✅ SUCCESS
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