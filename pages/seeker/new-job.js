// 🔒 AUTH LOCKED – DO NOT MODIFY AUTH LOGIC
// Seeker job status page – REAL DB + REALTIME + auto chat redirect + rating

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import RequireRole from "../../components/auth/RequireRole";
import { supabase } from "../../lib/supabaseClient";
import {
  Clock,
  CheckCircle,
  XCircle,
  MessageSquare,
} from "lucide-react";

import RateProviderCard from "../../components/seeker/RateProviderCard";

export default function SeekerNewJob() {
  const router = useRouter();
  const [job, setJob] = useState(null);
  const [hasRated, setHasRated] = useState(false);
  const [loading, setLoading] = useState(true);
  const redirectedRef = useRef(false); // 🔐 prevent redirect loop

  useEffect(() => {
    let channel;

    async function loadLatestJob() {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;
      if (!user) {
        setLoading(false);
        return;
      }

      // 1️⃣ Latest job by seeker
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("seeker_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (!error && data) {
        // 🔐 Fetch provider name safely
        let providerName = "Provider";

        if (data.provider_id) {
          const { data: prof } = await supabase
            .from("profiles")
            .select("name")
            .eq("id", data.provider_id)
            .maybeSingle();

          if (prof?.name && !String(prof.name).includes("@")) {
            providerName = String(prof.name).split(" ")[0];
          }
        }

        setJob({
          ...data,
          provider_name: providerName, // ✅ SAFE DISPLAY NAME
        });

        // 2️⃣ Check if already rated
        const { data: existingRating } = await supabase
          .from("ratings")
          .select("id")
          .eq("job_id", data.id)
          .maybeSingle();

        setHasRated(!!existingRating);

        // 3️⃣ Realtime updates for THIS job
        channel = supabase
          .channel("seeker-job-" + data.id)
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "jobs",
              filter: `id=eq.${data.id}`,
            },
            async (payload) => {
              // Keep provider name stable
              setJob((prev) => ({
                ...payload.new,
                provider_name: prev?.provider_name || "Provider",
              }));
            }
          )
          .subscribe();
      }

      setLoading(false);
    }

    loadLatestJob();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  // 🔁 AUTO-REDIRECT TO CHAT WHEN ACCEPTED (ONCE)
  useEffect(() => {
    if (
      job?.status === "accepted" &&
      job?.id &&
      !redirectedRef.current
    ) {
      redirectedRef.current = true;
      router.push(`/chat/${job.id}`);
    }
  }, [job?.status, job?.id, router]);

  if (loading) {
    return (
      <RequireRole role="seeker">
        <div className="min-h-screen flex items-center justify-center text-gray-500">
          Loading job…
        </div>
      </RequireRole>
    );
  }

  if (!job) {
    return (
      <RequireRole role="seeker">
        <div className="min-h-screen flex items-center justify-center text-gray-500">
          No job found.
        </div>
      </RequireRole>
    );
  }

  const statusMeta = {
    pending: {
      label: "Waiting for provider",
      icon: Clock,
      color: "text-amber-600",
    },
    accepted: {
      label: "Provider accepted",
      icon: CheckCircle,
      color: "text-gray-600",
    },
    rejected: {
      label: "Provider rejected",
      icon: XCircle,
      color: "text-gray-600",
    },
    completed: {
      label: "Job completed",
      icon: CheckCircle,
      color: "text-gray-600",
    },
  };

  const meta = statusMeta[job.status] || statusMeta.pending;
  const Icon = meta.icon;

  return (
    <RequireRole role="seeker">
      <div className="min-h-screen flex items-center justify-center bg-[#eef1f6] px-4">
        <div className="w-full max-w-xl bg-white rounded-3xl p-10 shadow border">
          <h1 className="text-2xl font-bold text-[#0b1220]">
            Job Status
          </h1>

          <p className="text-sm text-gray-500 mt-1">
            Updates in real time.
          </p>

          {/* JOB INFO */}
          <div className="mt-6 space-y-2 text-sm">
            <p>
              <span className="font-semibold">Service:</span>{" "}
              {job.service_title}
            </p>
            <p>
              <span className="font-semibold">Address:</span>{" "}
              {job.address || "—"}
            </p>
            {job.budget && (
              <p>
                <span className="font-semibold">Budget:</span>{" "}
                ₦{job.budget}
              </p>
            )}
          </div>

          {/* STATUS */}
          <div className="mt-8 flex items-center gap-3 p-4 rounded-xl bg-gray-50 border">
            <Icon className={meta.color} size={22} />
            <div>
              <p className="text-sm font-semibold capitalize">
                {job.status}
              </p>
              <p className="text-xs text-gray-500">
                {meta.label}
              </p>
            </div>
          </div>

          {/* ⭐ RATE PROVIDER */}
          {job.status === "completed" && !hasRated && (
            <RateProviderCard
              job={job}
              providerName={job.provider_name}
              onRated={() => setHasRated(true)}
            />
          )}

          {/* MANUAL CHAT BUTTON */}
          {job.status === "accepted" && (
            <div className="mt-6">
              <button
                onClick={() => router.push(`/chat/${job.id}`)}
                className="w-full flex items-center justify-center gap-2
                           px-5 py-3 rounded-xl text-sm font-semibold
                           bg-[#0b1220] text-white"
              >
                <MessageSquare size={16} />
                Open chat with {job.provider_name}
              </button>
            </div>
          )}

          {/* ACTIONS */}
          <div className="mt-8 flex justify-between">
            <button
              onClick={() => router.push("/seeker/dashboard")}
              className="px-5 py-3 rounded-xl text-sm font-semibold bg-gray-200"
            >
              Back to dashboard
            </button>

            <button
              onClick={() => router.push("/seeker/create-job")}
              className="px-5 py-3 rounded-xl text-sm font-semibold
                         bg-[#0b1220] text-white"
            >
              Create another job
            </button>
          </div>
        </div>
      </div>
    </RequireRole>
  );
}