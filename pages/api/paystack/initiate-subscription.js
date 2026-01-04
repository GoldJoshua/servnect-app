// pages/api/paystack/initiate-subscription.js
// 🔒 SERVER ONLY – DO NOT EXPOSE SECRET KEY TO CLIENT

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { payment_type, email, user_id, callbackPath } = req.body;

    if (!payment_type || !email || !user_id) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    /**
     * VAT CONFIG
     */
    const VAT_RATE = 0.075;

    function withVat(baseNaira) {
      const baseKobo = baseNaira * 100;
      const vatKobo = Math.round(baseKobo * VAT_RATE);
      return baseKobo + vatKobo;
    }

    /**
     * PAYMENT AMOUNTS (VAT INCLUSIVE — KOBO)
     */
    const PAYMENTS = {
      activation: {
        amount: withVat(2500), // ₦2,687.50
        description: "Provider activation fee",
      },
      basic: {
        amount: withVat(2500), // ₦2,687.50
        description: "Basic subscription",
      },
      premium: {
        amount: withVat(10000), // ₦10,750.00
        description: "Premium subscription",
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
            payment_type,
            vat_included: true,
            vat_rate: VAT_RATE,
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
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}