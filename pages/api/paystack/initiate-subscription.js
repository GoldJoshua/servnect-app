// pages/api/paystack/initiate-subscription.js
// 🔒 SERVER ONLY – DO NOT EXPOSE SECRET KEY TO CLIENT

import { supabase } from "../../../lib/supabaseClient";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { payment_type, email, user_id, callbackPath } = req.body;

    if (!payment_type || !email || !user_id) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // 🔒 PREVENT DUPLICATE ACTIVATION PAYMENTS
    if (payment_type === "activation") {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("activation_paid")
        .eq("id", user_id)
        .single();

      if (error) {
        console.error("Activation status check failed:", error);
        return res.status(500).json({
          error: "Unable to verify activation status",
        });
      }

      if (profile?.activation_paid === true) {
        return res.status(400).json({
          error: "Activation fee has already been paid for this account.",
        });
      }
    }

    /**
     * 💰 VAT-INCLUSIVE AMOUNTS (KOBO)
     * SINGLE SOURCE OF TRUTH
     */
    const PAYMENTS = {
      activation: {
        amount: 268750, // ₦2,687.50
        description: "Provider activation fee",
      },
      basic: {
        amount: 322500, // ₦3,225.00
        description: "Basic subscription (monthly)",
      },
      premium: {
        amount: 1075000, // ₦10,750.00
        description: "Premium subscription (monthly)",
      },
    };

    const selectedPayment = PAYMENTS[payment_type];
    if (!selectedPayment) {
      return res.status(400).json({ error: "Invalid payment type" });
    }

    const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
    if (!PAYSTACK_SECRET_KEY) {
      return res.status(500).json({ error: "PAYSTACK_SECRET_KEY not set" });
    }

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || "https://app.servnect.com";

    const paystackRes = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          amount: selectedPayment.amount,
          currency: "NGN",
          callback_url: `${appUrl}${callbackPath || "/payment/processing"}`,
          metadata: {
            user_id,
            payment_type, // 🔑 USED BY WEBHOOK
            vat_included: true,
          },
        }),
      }
    );

    const json = await paystackRes.json();

    if (!json.status) {
      return res.status(500).json({ error: json.message });
    }

    return res.status(200).json({
      authorizationUrl: json.data.authorization_url,
      reference: json.data.reference,
    });
  } catch (err) {
    console.error("Paystack init error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}