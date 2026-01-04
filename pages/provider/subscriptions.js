// 🔒 AUTH LOCKED – DO NOT MODIFY
// This page is protected by RequireRole (provider only).
// UI changes are allowed. Auth logic must stay in RequireRole.
//
// ✅ Paystack-ready subscription UI (Free / Basic / Premium)
// ✅ Supports MAGIC AUTO-LOGIN from mobile (?token=...)
// ⚠️ Requires API route: /pages/api/auth/magic-provider-login.js

import crypto from "crypto";
import { useEffect, useMemo, useState } from "react";
import RequireRole from "../../components/auth/RequireRole";
import { supabase } from "../../lib/supabaseClient";

import ProviderLayout from "../../components/layouts/ProviderLayout";
import ProviderHeader from "../../components/provider/ProviderHeader";
import { Crown, CheckCircle, Sparkles } from "lucide-react";

/* =========================================
   🔐 MAGIC TOKEN AUTO-LOGIN (SERVER-SIDE)
   ========================================= */
export async function getServerSideProps({ query, req, res }) {
  try {
    const token = query.token;
    if (!token) {
      return { props: {} };
    }

    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const { data: row, error } = await supabase
      .from("magic_login_tokens")
      .select("*")
      .eq("token_hash", tokenHash)
      .is("used_at", null)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (error || !row) {
      return {
        redirect: {
          destination: "/login",
          permanent: false,
        },
      };
    }

    // Burn token (single-use)
    await supabase
      .from("magic_login_tokens")
      .update({ used_at: new Date().toISOString() })
      .eq("id", row.id);

    // Create Supabase session (server-side)
    const { data: sessionData, error: sessionError } =
      await supabase.auth.admin.createSession({
        userId: row.profile_id,
      });

    if (sessionError || !sessionData?.session) {
      return {
        redirect: {
          destination: "/login",
          permanent: false,
        },
      };
    }

    const accessToken = sessionData.session.access_token;
    const refreshToken = sessionData.session.refresh_token;

    // Set auth cookies
    res.setHeader("Set-Cookie", [
      `sb-access-token=${accessToken}; Path=/; HttpOnly; Secure; SameSite=Lax`,
      `sb-refresh-token=${refreshToken}; Path=/; HttpOnly; Secure; SameSite=Lax`,
    ]);

    // Clean redirect (remove token from URL)
    return {
      redirect: {
        destination: "/provider/subscription",
        permanent: false,
      },
    };
  } catch (_) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }
}

/* =========================================
   CLIENT COMPONENT (UNCHANGED LOGIC)
   ========================================= */

function ProviderSubscriptionContent() {
  const [name, setName] = useState("Provider");
  const [currentPlan, setCurrentPlan] = useState("free");
  const [loadingPlan, setLoadingPlan] = useState(null); // "basic" | "premium" | null
  const [err, setErr] = useState("");

  const plans = useMemo(
    () => [
      {
        key: "free",
        title: "Free Plan",
        price: 0,
        period: "Forever",
        badge: null,
        features: [
          "✅ 1 job request TOTAL (upgrade required for more)",
          "🔍 Listed last in search results",
          "👤 Basic profile listing only",
          "📩 Can receive one job request",
          "❌ No priority placement",
          "❌ No badges or highlights",
          "❌ No access to premium tools",
          "❌ No analytics or insights",
          "❌ No priority support",
        ],
      },
      {
        key: "basic",
        title: "Basic Plan",
        price: 2500,
        period: "per month",
        badge: "POPULAR",
        features: [
          "🚀 Higher visibility in search results",
          "📩 Up to 10 job requests per month",
          "🏷️ Basic verification badge on profile",
          "⚡ Faster job notifications",
          "📊 Basic performance insights",
          "🛠️ Standard customer support",
        ],
      },
      {
        key: "premium",
        title: "Premium Visibility",
        price: 10000,
        period: "per month",
        badge: "BEST VALUE",
        features: [
          "🥇 Top placement in search results",
          "🔥 Unlimited job requests per month",
          "⭐ Premium featured badge",
          "💼 Featured provider visibility",
          "📈 Advanced analytics & insights",
          "⚡ Instant job notifications",
          "💬 Priority customer support",
          "🧠 Early access to new premium features",
        ],
      },
    ],
    []
  );

  useEffect(() => {
    async function loadProfile() {
      setErr("");

      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;
      if (!user) return;

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("name, subscription_plan")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Profile fetch error:", error);
        return;
      }

      if (profile?.name) setName(profile.name.split(" ")[0]);
      setCurrentPlan(profile?.subscription_plan || "free");
    }

    loadProfile();
  }, []);

  function isCurrentOrHigher(planKey) {
    const rank = { free: 0, basic: 1, premium: 2 };
    return (rank[currentPlan] ?? 0) >= (rank[planKey] ?? 0);
  }

  async function startPaystackCheckout(planKey) {
    setErr("");

    if (!planKey || planKey === "free") return;

    if (isCurrentOrHigher(planKey)) {
      setErr("You’re already on this plan (or higher).");
      return;
    }

    setLoadingPlan(planKey);

    try {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;

      if (!user?.email) {
        setErr("Could not detect your account email. Please log in again.");
        setLoadingPlan(null);
        return;
      }

      const res = await fetch("/api/paystack/initiate-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
       body: JSON.stringify({
  payment_type: planKey,
  email: user.email,
  user_id: user.id,
  callbackPath: "/payment/processing",
}),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        setErr(
          json?.error ||
            "Unable to start Paystack checkout. (API route missing or failed)"
        );
        setLoadingPlan(null);
        return;
      }

      const authorizationUrl =
        json?.authorizationUrl || json?.authorization_url;

      if (!authorizationUrl) {
        setErr("Paystack did not return an authorization URL.");
        setLoadingPlan(null);
        return;
      }

      window.location.href = authorizationUrl;
    } catch (e) {
      console.error(e);
      setErr("Something went wrong starting payment. Try again.");
      setLoadingPlan(null);
    }
  }

  return (
    <ProviderLayout>
      <div className="min-h-screen bg-[#eef1f6]">
        <main className="flex-1 px-6 py-6">
          <ProviderHeader name={name} />

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-[#0b1220]">
              Subscription & Visibility
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Choose a plan to boost your visibility and get more job requests.
            </p>

            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-white border shadow-sm">
              <Sparkles size={14} className="text-amber-500" />
              Current plan:{" "}
              <span className="text-[#0b1220]">
                {currentPlan?.toUpperCase?.() || "FREE"}
              </span>
            </div>

            {err ? (
              <div className="mt-3 text-sm text-gray-600">{err}</div>
            ) : null}
          </div>

          <div className="grid lg:grid-cols-3 gap-6 max-w-6xl">
            {plans.map((p) => {
              const isCurrent = currentPlan === p.key;
              const isDisabled =
                p.key === "free" || isCurrentOrHigher(p.key);

              const premiumStyle =
                p.key === "premium"
                  ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-xl"
                  : "bg-white text-[#0b1220] border shadow";

              return (
                <div
                  key={p.key}
                  className={`rounded-3xl p-6 relative ${premiumStyle}`}
                >
                  {p.badge ? (
                    <div
                      className={`absolute -top-4 right-6 px-3 py-1 rounded-full text-xs font-semibold ${
                        p.key === "premium"
                          ? "bg-black/20 text-white"
                          : "bg-[#0b1220] text-white"
                      }`}
                    >
                      {p.badge}
                    </div>
                  ) : null}

                  <div className="flex items-center gap-2 mb-2">
                    {p.key === "premium" ? <Crown size={18} /> : null}
                    <h3 className="text-lg font-bold">{p.title}</h3>
                  </div>

                  <div className="mt-2">
                    <div className="text-3xl font-extrabold">
                      ₦{Number(p.price).toLocaleString()}
                    </div>
                    <div
                      className={`text-sm mt-1 ${
                        p.key === "premium"
                          ? "text-white/80"
                          : "text-gray-500"
                      }`}
                    >
                      {p.period}
                    </div>
                  </div>

                  <ul className="mt-5 space-y-3 text-sm">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-center gap-2">
                        <CheckCircle
                          size={16}
                          className={
                            p.key === "premium"
                              ? "text-white"
                              : "text-gray-500"
                          }
                        />
                        <span
                          className={
                            p.key === "premium"
                              ? "text-white/95"
                              : "text-gray-600"
                          }
                        >
                          {f}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-6">
                    {isCurrent ? (
                      <button
                        disabled
                        className={`w-full py-3 rounded-xl text-sm font-semibold cursor-not-allowed ${
                          p.key === "premium"
                            ? "bg-white/25 text-white"
                            : "bg-gray-200 text-gray-500"
                        }`}
                      >
                        Current Plan
                      </button>
                    ) : (
                      <button
                        onClick={() => startPaystackCheckout(p.key)}
                        disabled={isDisabled || loadingPlan === p.key}
                        className={`w-full py-3 rounded-xl text-sm font-semibold transition ${
                          p.key === "premium"
                            ? "bg-white text-[#0b1220] shadow-lg"
                            : "bg-[#0b1220] text-white shadow-lg"
                        } ${
                          isDisabled
                            ? "opacity-50 cursor-not-allowed"
                            : "hover:opacity-95"
                        }`}
                      >
                        {loadingPlan === p.key
                          ? "Redirecting to Paystack..."
                          : p.key === "free"
                          ? "Free"
                          : `Subscribe to ${p.key.toUpperCase()}`}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="max-w-6xl mt-8 text-xs text-gray-500">
            Payments are processed securely via <b>Paystack</b>. After payment,
            your plan will update automatically (via webhook).
          </div>
        </main>
      </div>
    </ProviderLayout>
  );
}

export default function ProviderSubscription() {
  return (
    <RequireRole role="provider">
      <ProviderSubscriptionContent />
    </RequireRole>
  );
}