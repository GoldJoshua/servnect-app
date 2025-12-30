// pages/seeker/jobs/[id].js
// 🔒 AUTH LOCKED – DO NOT MODIFY AUTH LOGIC
// Seeker Job Details + Completion + Redirect to Rating
// UI aligned with SeekerLayout (desktop + mobile safe)

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import RequireRole from "../../../components/auth/RequireRole";
import SeekerLayout from "../../../components/layouts/SeekerLayout";
import { supabase } from "../../../lib/supabaseClient";

export default function SeekerJobDetailsPage() {
  return (
    <RequireRole role="seeker">
      <SeekerJobDetails />
    </RequireRole>
  );
}

function SeekerJobDetails() {
  const router = useRouter();
  const { id } = router.query;

  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState(null);
  const [provider, setProvider] = useState(null);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    let channel;
    let mounted = true;

    async function loadJob() {
      if (!id) return;

      setLoading(true);
      setError("");

      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;
      if (!user) return;

      const { data: jobData, error: jobErr } = await supabase
        .from("jobs")
        .select("*")
        .eq("id", id)
        .single();

      if (!mounted) return;

      if (jobErr || !jobData) {
        setError("Job not found.");
        setLoading(false);
        return;
      }

      if (jobData.seeker_id !== user.id) {
        setError("Not authorized to view this job.");
        setLoading(false);
        return;
      }

      setJob(jobData);

      // LOAD PROVIDER PROFILE
      if (jobData.provider_id) {
        const { data: providerProfile } = await supabase
          .from("profiles")
          .select("id, full_name, name, phone")
          .eq("id", jobData.provider_id)
          .single();

        setProvider(providerProfile || null);
      }

      // REALTIME JOB STATUS UPDATES
      channel = supabase
        .channel("seeker-job-live-" + id)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "jobs",
            filter: `id=eq.${id}`,
          },
          (payload) => {
            setJob(payload.new);
          }
        )
        .subscribe();

      setLoading(false);
    }

    loadJob();

    return () => {
      mounted = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, [id]);

  async function markJobCompleted() {
    if (!job) return;

    setActionLoading(true);
    setError("");

    const { error } = await supabase
      .from("jobs")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", job.id);

    setActionLoading(false);

    if (error) {
      setError(error.message || "Failed to mark job as completed.");
      return;
    }

    // REDIRECT TO RATING PAGE
    router.push(`/seeker/rate/${job.id}`);
  }

  return (
    <SeekerLayout>
      <div className="min-h-screen bg-[#eef1f6]">
        <main className="px-4 lg:px-6 py-6 max-w-5xl mx-auto">
          <button
            onClick={() => router.push("/seeker/dashboard")}
            className="mb-4 text-xs border px-3 py-1 rounded bg-white"
          >
            Back
          </button>

          {loading ? (
            <div className="bg-white p-6 rounded-2xl border text-sm text-gray-500">
              Loading job…
            </div>
          ) : error ? (
            <div className="bg-white p-6 rounded-2xl border text-sm text-red-600">
              {error}
            </div>
          ) : (
            <div className="space-y-6">
              {/* JOB DETAILS */}
              <div className="bg-white rounded-2xl border p-6">
                <h2 className="text-xl font-bold text-[#0b1220]">
                  Job Details
                </h2>

                <div className="mt-4 grid sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-400 text-xs">Service</div>
                    <div className="font-semibold">
                      {job.service_title || "—"}
                    </div>
                  </div>

                  <div>
                    <div className="text-gray-400 text-xs">Status</div>
                    <div className="font-semibold uppercase">
                      {job.status}
                    </div>
                  </div>

                  <div>
                    <div className="text-gray-400 text-xs">Budget</div>
                    <div className="font-semibold">
                      ₦{Number(job.budget || 0).toLocaleString()}
                    </div>
                  </div>

                  <div>
                    <div className="text-gray-400 text-xs">Created</div>
                    <div className="font-semibold">
                      {new Date(job.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* ASSIGNED PROVIDER */}
              {provider && (
                <div className="bg-white rounded-2xl border p-6">
                  <h3 className="font-semibold text-[#0b1220] mb-2">
                    Assigned Provider
                  </h3>

                  <div className="text-sm text-gray-700">
                    <div className="font-semibold">
                      {provider.full_name ||
                        provider.name ||
                        "Provider"}
                    </div>

                    {provider.phone && (
                      <a
                        href={`tel:${provider.phone}`}
                        className="mt-2 inline-block text-[#0b1220] underline font-medium"
                      >
                        Call: {provider.phone}
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* JOB COMPLETION */}
              <div className="bg-white rounded-2xl border p-6">
                <h3 className="font-semibold text-[#0b1220] mb-2">
                  Job Completion
                </h3>

                {job.status === "provider_completed" ? (
                  <>
                    <p className="text-sm text-gray-600 mb-4">
                      The provider has marked this job as completed.
                    </p>

                    <button
                      onClick={markJobCompleted}
                      disabled={actionLoading}
                      className="px-6 py-3 rounded-xl bg-[#0b1220] text-white font-semibold"
                    >
                      {actionLoading
                        ? "Completing…"
                        : "Confirm Job Completion"}
                    </button>
                  </>
                ) : (
                  <div className="text-sm text-gray-500">
                    Waiting for provider to complete the job.
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </SeekerLayout>
  );
}