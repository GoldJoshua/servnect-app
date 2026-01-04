// pages/api/paystack/initiate-subscription.js
// 🔒 SERVER ONLY – DO NOT EXPOSE SECRET KEY TO CLIENT
// Handles:
// - Provider activation fee
// - Basic subscription
// - Premium subscription
//
// This version supports:
// ✅ Google Secret Manager (preferred)
// ✅ Local dev fallback using .env.local PAYSTACK_SECRET_KEY (optional)

import { SecretManagerServiceClient } from "@google-cloud/secret-manager";

const smClient = new SecretManagerServiceClient();

/**
 * Reads secret from Google Secret Manager.
 * Requires:
 * - process.env.GCP_PROJECT_ID
 * - Service account with Secret Manager Secret Accessor in production
 * - For local dev: `gcloud auth application-default login`
 */
async function getGcpSecret(secretName) {
  const projectId = process.env.GCP_PROJECT_ID;
  if (!projectId) return null;

  const [version] = await smClient.accessSecretVersion({
    name: `projects/${projectId}/secrets/${secretName}/versions/latest`,
  });

  return version?.payload?.data?.toString() || null;
}

/**
 * Returns Paystack secret key using:
 * 1) Google Secret Manager (PAYSTACK_TEST_SECRET_KEY)
 * 2) Fallback: process.env.PAYSTACK_SECRET_KEY (only for local dev if you want)
 */
async function getPaystackSecretKey() {
  const fromGcp = await getGcpSecret("PAYSTACK_TEST_SECRET_KEY");
  if (fromGcp) return fromGcp;

  // Fallback (optional) — only if you set it locally.
  if (process.env.PAYSTACK_SECRET_KEY) return process.env.PAYSTACK_SECRET_KEY;

  return null;
}

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

    // ✅ Get Paystack secret securely
    const PAYSTACK_SECRET_KEY = await getPaystackSecretKey();
    if (!PAYSTACK_SECRET_KEY) {
      return res.status(500).json({
        error:
          "Paystack secret key missing. Set GCP_PROJECT_ID + Secret Manager access, or add PAYSTACK_SECRET_KEY for local dev fallback.",
      });
    }

    // ✅ App base URL (used for callback_url)
    // Use NEXT_PUBLIC_APP_URL if set; otherwise infer from request host
    const inferredBaseUrl = `${req.headers["x-forwarded-proto"] || "https"}://${
      req.headers["x-forwarded-host"] || req.headers.host
    }`;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || inferredBaseUrl;

    /**
     * Initialize Paystack transaction
     */
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
          callback_url: `${appUrl}${callbackPath || "/provider/subscription"}`,
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
        error: json.message || "Failed to initialize Paystack transaction",
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