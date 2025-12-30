// components/seeker/ProviderDiscoveryCard.js
// 🔒 AUTH SAFE – READ-ONLY + REALTIME
// Seeker → Provider discovery card (realtime, DB-driven)

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  MapPin,
  Star,
  Briefcase,
  Clock,
  AlertTriangle,
  Lock,
} from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

export default function ProviderDiscoveryCard({
  providerId,
  providerName,
  seekerState,
  subcategoryId,

  // 🔐 SUBSCRIPTION / LIMIT ENFORCEMENT (FROM RPC)
  subscriptionPlan,
  jobsDone30d,
  jobLimit,
  isAtLimit,
}) {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // ─────────────────────────────────────────────
  // LOAD PROVIDER PROFILE (SOURCE OF TRUTH)
  // ─────────────────────────────────────────────
  useEffect(() => {
    let channel;

    async function loadProfile() {
      const { data, error } = await supabase
        .from("profiles")
        .select(
          `
          id,
          full_name,
          state,
          rating,
          review_count,
          completed_jobs,
          experience,
          emergency_service,
          service_availability_status
        `
        )
        .eq("id", providerId)
        .single();

      if (!error) {
        setProfile(data);
      }

      setLoading(false);

      // 🔁 REALTIME SUBSCRIPTION
      channel = supabase
        .channel(`provider-profile-${providerId}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "profiles",
            filter: `id=eq.${providerId}`,
          },
          (payload) => {
            setProfile(payload.new);
          }
        )
        .subscribe();
    }

    loadProfile();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [providerId]);

  // ─────────────────────────────────────────────
  // REQUEST JOB (BLOCKED IF AT LIMIT)
  // ─────────────────────────────────────────────
  function requestJob() {
    if (isAtLimit) return; // 🔒 HARD BLOCK

    localStorage.setItem(
      "create_job_context",
      JSON.stringify({
        provider: providerId,
        subcategory: subcategoryId,
      })
    );

    router.push("/seeker/create-job");
  }

  if (loading || !profile) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow border">
        <p className="text-sm text-gray-400">Loading provider…</p>
      </div>
    );
  }

  return (
    <div
      className={`bg-white rounded-2xl p-6 shadow border flex flex-col gap-4 transition ${
        isAtLimit ? "opacity-40 cursor-not-allowed" : ""
      }`}
    >
      {/* NAME */}
      <h2 className="text-xl font-semibold text-[#0b1220]">
        {profile.full_name || providerName || "Provider"}
      </h2>

      {/* LOCATION */}
      <div className="flex items-center gap-2 text-gray-500 text-sm">
        <MapPin size={16} />
        <span>Available in {profile.state || seekerState}</span>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mt-2">
        <div className="flex items-center gap-2">
          <Star size={16} />
          <span>
            {profile.review_count > 0
              ? `${profile.rating} ⭐ (${profile.review_count})`
              : "No reviews yet"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Briefcase size={16} />
          <span>{profile.completed_jobs ?? 0} jobs completed</span>
        </div>

        <div className="flex items-center gap-2">
          <Clock size={16} />
          <span>{profile.experience || "Experience not specified"}</span>
        </div>

        <div className="flex items-center gap-2">
          <AlertTriangle size={16} />
          <span>
            {profile.emergency_service
              ? "Emergency service available"
              : "No emergency service"}
          </span>
        </div>
      </div>

      {/* AVAILABILITY */}
      <div className="mt-2">
        <span
          className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
            profile.service_availability_status === "available"
              ? "bg-green-100 text-green-700"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          {profile.service_availability_status || "Availability unknown"}
        </span>
      </div>

      {/* 🔒 LIMIT WARNING */}
      {isAtLimit && (
        <div className="mt-2 flex items-start gap-2 text-xs text-red-600">
          <Lock size={14} className="mt-[2px]" />
          <div>
            <div className="font-semibold">
              Unavailable — monthly job limit reached
            </div>
            <div className="text-[11px] text-gray-600">
              {subscriptionPlan || "Free"} plan · {jobsDone30d}/{jobLimit} jobs
              used
            </div>
          </div>
        </div>
      )}

      {/* ACTION */}
      <button
        onClick={requestJob}
        disabled={isAtLimit}
        className={`mt-4 px-5 py-3 rounded-xl text-sm font-semibold shadow transition ${
          isAtLimit
            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
            : "bg-[#0b1220] text-white hover:opacity-95"
        }`}
      >
        {isAtLimit ? "Unavailable — limit reached" : "Request Job"}
      </button>
    </div>
  );
}