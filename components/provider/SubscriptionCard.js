// 🔒 AUTH LOCKED – DO NOT MODIFY AUTH LOGIC
// Provider Subscription & Visibility Card
// REAL DATA ONLY — no props, no fake states

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { Crown, Sparkles } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

export default function SubscriptionCard({ activationPaid = true }) {
  const router = useRouter();
  const [plan, setPlan] = useState("free");
  const [expiresAt, setExpiresAt] = useState(null);

  // 🔁 Load subscription from DB (REAL SOURCE)
  useEffect(() => {
    let channel;

    async function loadPlan() {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("subscription_plan, subscription_expires_at")
        .eq("id", user.id)
        .single();

      if (!error && data) {
        setPlan(data.subscription_plan || "free");
        setExpiresAt(data.subscription_expires_at);
      }

      // 🔴 Realtime subscription updates
      channel = supabase
        .channel("profile-subscription-" + user.id)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "profiles",
            filter: `id=eq.${user.id}`,
          },
          (payload) => {
            setPlan(payload.new.subscription_plan || "free");
            setExpiresAt(payload.new.subscription_expires_at);
          }
        )
        .subscribe();
    }

    loadPlan();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  const meta = useMemo(() => {
    const p = (plan || "free").toLowerCase();
    const isFree = p === "free";
    const isBasic = p === "basic";
    const isPremium = p === "premium";

    const cta =
      isFree
        ? { label: "Upgrade to Basic", next: "basic" }
        : isBasic
        ? { label: "Upgrade to Premium", next: "premium" }
        : { label: "Manage Subscription", next: null };

    const hint =
      isFree
        ? "Free plan: your profile appears below Basic & Premium providers in search results."
        : isBasic
        ? "Basic plan: you rank above Free providers, but below Premium providers."
        : "Premium plan: you appear first in search results with priority visibility.";

    return { p, isFree, isBasic, isPremium, cta, hint };
  }, [plan]);

  const expiryText = expiresAt
    ? new Date(expiresAt).toLocaleDateString()
    : null;

  return (
    <div
      className={`rounded-3xl border shadow bg-white overflow-hidden ${
        !activationPaid ? "opacity-50 pointer-events-none" : ""
      }`}
    >
      <div
        className="p-6"
        style={{
          background: "linear-gradient(135deg, #0B1220 0%, #111827 100%)",
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Crown size={18} style={{ color: "#e5e7eb" }} />
              <h3 className="font-bold text-lg text-white">
                Visibility & Plan
              </h3>
            </div>

            <p className="text-sm mt-2 text-white/80">
              {meta.hint}
            </p>

            <div className="mt-4 inline-flex flex-wrap items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/10 text-white/90 border border-white/10">
              <Sparkles size={14} style={{ color: "#e5e7eb" }} />
              <span>
                Current plan:{" "}
                <strong>{meta.p.toUpperCase()}</strong>
              </span>
              {expiryText && (
                <span className="text-white/70">
                  • Expires {expiryText}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* FEATURES */}
        <div className="mt-5 flex flex-wrap gap-2">
          {meta.isFree && (
            <>
              <Pill>Standard listing</Pill>
              <Pill>Lower visibility</Pill>
              <Pill>No priority jobs</Pill>

              {/* ✅ ADDITIVE ONLY — backend-aligned */}
              <Pill>1 job until subscription upgrade</Pill>
            </>
          )}

          {meta.isBasic && (
            <>
              <Pill>Higher ranking</Pill>
              <Pill>Basic badge</Pill>
              <Pill>More job exposure</Pill>
            </>
          )}

          {meta.isPremium && (
            <>
              <Pill>Top ranking</Pill>
              <Pill>Featured badge</Pill>
              <Pill>Priority visibility</Pill>
            </>
          )}
        </div>

        {/* CTA */}
        <div className="mt-6 flex items-center justify-between gap-3">
          <div className="text-xs text-white/70">
            Monthly & yearly plans available
          </div>

          <button
            onClick={() => router.push("/provider/subscription")}
            disabled={!activationPaid}
            className="px-4 py-2 rounded-xl text-sm font-semibold shadow"
            style={{
              backgroundColor: meta.isPremium
                ? "rgba(255,255,255,0.14)"
                : "#e5e7eb",
              color: meta.isPremium ? "#fff" : "#0B1220",
              border: meta.isPremium
                ? "1px solid rgba(255,255,255,0.14)"
                : "none",
            }}
          >
            {activationPaid
              ? meta.cta.label
              : "Activate account first"}
          </button>
        </div>

        {/* 🔒 ADDITIVE NOTICE ONLY */}
        {!activationPaid && (
          <div className="mt-4 text-xs text-white/70">
            Subscription upgrades are available after account activation.
          </div>
        )}
      </div>
    </div>
  );
}

function Pill({ children }) {
  return (
    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-white/85 border border-white/10">
      {children}
    </span>
  );
}