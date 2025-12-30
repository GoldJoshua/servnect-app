// pages/api/paystack/initiate-subscription.js
// 🔒 SERVER ONLY – DO NOT EXPOSE SECRET KEY TO CLIENT
// Handles:
// - Provider activation fee
// - Basic subscription
// - Premium subscription

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
     * PAYMENT DEFINITIONS (ALL AMOUNTS IN KOBO)
     */
    const PAYMENTS = {
      activation: {
        amount: 2500 * 100, // ₦2,500 one-time
        description: "Provider activation fee",
      },
      basic: {
        amount: 2500 * 100, // ₦2,500 / month
        description: "Basic subscription (10 jobs per month)",
        durationDays: 30,
      },
      premium: {
        amount: 10000 * 100, // ₦10,000 / month
        description: "Premium subscription (unlimited jobs)",
        durationDays: 30,
      },
    };

    const selectedPayment = PAYMENTS[payment_type];

    if (!selectedPayment) {
      return res.status(400).json({ error: "Invalid payment type" });
    }

    /**
     * Initialize Paystack transaction
     */
    const paystackRes = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          amount: selectedPayment.amount,
          currency: "NGN",
          callback_url: `${process.env.NEXT_PUBLIC_APP_URL}${
            callbackPath || "/provider/subscription"
          }`,
          metadata: {
            user_id,
            payment_type, // activation | basic | premium
            description: selectedPayment.description,
            duration_days: selectedPayment.durationDays || null,
            source: "serviceconnect",
          },
        }),
      }
    );

    const json = await paystackRes.json();

    if (!json.status) {
      return res.status(500).json({
        error:
          json.message ||
          "Failed to initialize Paystack transaction",
      });
    }

    return res.status(200).json({
      authorizationUrl: json.data.authorization_url,
      reference: json.data.reference,
    });
  } catch (err) {
    console.error("Paystack init error:", err);
    return res.status(500).json({
      error: "Internal server error initializing payment",
    });
  }
}