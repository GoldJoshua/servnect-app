// pages/seeker/rate/[jobId].js
// 🔒 AUTH LOCKED – DO NOT MODIFY AUTH LOGIC
// Seeker → Rate Provider (Canonical Rating Page)
// UI aligned with SeekerLayout (desktop + mobile safe)

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import RequireRole from "../../../components/auth/RequireRole";
import SeekerLayout from "../../../components/layouts/SeekerLayout";
import RateProviderCard from "../../../components/seeker/RateProviderCard";
import { supabase } from "../../../lib/supabaseClient";

export default function SeekerRatePage() {
  return (
    <RequireRole role="seeker">
      <SeekerRateContent />
    </RequireRole>
  );
}

function SeekerRateContent() {
  const router = useRouter();
  const { jobId } = router.query;

  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState(null);
  const [providerName, setProviderName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!jobId) return;

      setLoading(true);
      setError("");

      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;
      if (!user) return;

      // 1️⃣ LOAD JOB
      const { data: jobData, error: jobErr } = await supabase
        .from("jobs")
        .select("*")
        .eq("id", jobId)
        .single();

      if (!mounted) return;

      if (jobErr || !jobData) {
        setError("Job not found.");
        setLoading(false);
        return;
      }

      if (jobData.seeker_id !== user.id) {
        setError("Not authorized to rate this job.");
        setLoading(false);
        return;
      }

      if (jobData.status !== "completed") {
        setError("This job is not yet completed.");
        setLoading(false);
        return;
      }

      setJob(jobData);

      // 2️⃣ LOAD PROVIDER NAME
      if (jobData.provider_id) {
        const { data: provider } = await supabase
          .from("profiles")
          .select("full_name, name")
          .eq("id", jobData.provider_id)
          .single();

        setProviderName(
          provider?.full_name || provider?.name || "Provider"
        );
      }

      setLoading(false);
    }

    load();

    return () => {
      mounted = false;
    };
  }, [jobId]);

  return (
    <SeekerLayout>
      <div className="min-h-screen bg-[#eef1f6]">
        <main className="px-4 lg:px-6 py-8 max-w-4xl mx-auto">
          <button
            onClick={() => router.push("/seeker/dashboard")}
            className="mb-4 text-xs border px-3 py-1 rounded bg-white"
          >
            Back to dashboard
          </button>

          {loading ? (
            <div className="bg-white p-6 rounded-2xl border text-sm text-gray-500">
              Loading…
            </div>
          ) : error ? (
            <div className="bg-white p-6 rounded-2xl border text-sm text-red-600">
              {error}
            </div>
          ) : (
            <>
              <div className="bg-white rounded-2xl border p-6 mb-6">
                <h2 className="text-xl font-bold text-[#0b1220]">
                  Rate Your Provider
                </h2>

                <p className="text-sm text-gray-600 mt-1">
                  Job: <b>{job.service_title || "Service"}</b>
                </p>
              </div>

              <RateProviderCard
                job={job}
                providerName={providerName}
                onRated={() => {
                  setTimeout(() => {
                    router.push("/seeker/dashboard");
                  }, 1200);
                }}
              />
            </>
          )}
        </main>
      </div>
    </SeekerLayout>
  );
}