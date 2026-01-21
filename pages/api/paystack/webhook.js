// 🔒 PAYSTACK WEBHOOK – SERVER ONLY (HARDENED)

import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

/**
 * 🔐 SUPABASE SERVICE ROLE CLIENT (SERVER ONLY)
 * This prevents RLS issues for webhooks
 */
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * 💰 VAT-INCLUSIVE AMOUNTS (KOBO)
 */
const AMOUNTS = {
  activation: 268750, // ₦2,687.50
  basic: 322500,      // ₦3,225.00
  premium: 1075000,   // ₦10,750.00
};

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).end("Method Not Allowed");
  }

  try {
    const rawBody = await getRawBody(req);

    const signature = req.headers["x-paystack-signature"];
    const expectedSignature = crypto
      .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY)
      .update(rawBody)
      .digest("hex");

    if (signature !== expectedSignature) {
      console.error("❌ Invalid Paystack signature");
      return res.status(401).end("Invalid signature");
    }

    const event = JSON.parse(rawBody.toString());

    if (event.event !== "charge.success") {
      return res.status(200).json({ received: true });
    }

    const data = event.data;
    const metadata = data?.metadata || {};

    const userId = metadata.user_id;
    const paymentType = metadata.payment_type;
    const amountPaid = Number(data.amount);

    if (!userId || !paymentType) {
      console.error("❌ Missing metadata", metadata);
      return res.status(400).end("Invalid metadata");
    }

    const expectedAmount = AMOUNTS[paymentType];
    if (amountPaid !== expectedAmount) {
      console.error("❌ Amount mismatch", {
        expectedAmount,
        amountPaid,
        paymentType,
      });
      return res.status(400).end("Amount mismatch");
    }

    /**
     * 🔓 ACTIVATION
     */
    if (paymentType === "activation") {
      // 1️⃣ Update PROFILE (UI access)
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ activation_paid: true })
        .eq("id", userId);

      if (profileError) {
        console.error("❌ Activation update failed:", profileError);
        return res.status(500).end("Activation update failed");
      }

      // 2️⃣ Mirror activation into PROVIDERS (commission logic)
      const { data: provider, error: providerError } = await supabase
        .from("providers")
        .select("id")
        .eq("user_id", userId)
        .single();

      if (providerError || !provider) {
        console.error("❌ Provider not found for activation mirror", {
          userId,
          providerError,
        });
        // IMPORTANT: do NOT fail payment if this happens
      } else {
        const { error: providerUpdateError } = await supabase
          .from("providers")
          .update({
            activation_paid: true,
            activated_at: new Date().toISOString(),
          })
          .eq("id", provider.id);

        if (providerUpdateError) {
          console.error(
            "❌ Provider activation mirror failed",
            providerUpdateError
          );
          // IMPORTANT: log only, do NOT break UX
        }
      }
    }

    /**
     * ⭐ SUBSCRIPTIONS
     */
    if (paymentType === "basic" || paymentType === "premium") {
      const expiresAt = new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
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

      await supabase.rpc("downgrade_expired_subscriptions");
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error("❌ Paystack webhook error:", err);
    return res.status(500).end("Webhook processing error");
  }
}

function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = [];
    req.on("data", (chunk) => data.push(chunk));
    req.on("end", () => resolve(Buffer.concat(data)));
    req.on("error", reject);
  });
}