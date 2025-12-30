// 🔒 AUTH LOCKED – DO NOT MODIFY
// This page is protected by RequireRole (provider only).
// UI changes are allowed. Auth logic must stay in RequireRole.

// pages/provider/jobs.js

import { useEffect, useState } from "react";
import RequireRole from "../../components/auth/RequireRole";
import { supabase } from "../../lib/supabaseClient";

import ProviderLayout from "../../components/layouts/ProviderLayout";
import ProviderHeader from "../../components/provider/ProviderHeader";
import JobRequestCard from "../../components/provider/JobRequestCard";

function ProviderJobsContent() {
  const [name, setName] = useState("Provider");
  const [jobs, setJobs] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loadingJobId, setLoadingJobId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let channel;

    async function loadJobs() {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", user.id)
        .single();

      if (profile?.name) {
        setName(profile.name.split(" ")[0]);
      }

      const { data: jobsData } = await supabase
        .from("jobs")
        .select("*")
        .eq("provider_id", user.id)
        .order("created_at", { ascending: false });

      if (jobsData) {
        setJobs(jobsData);
      }

      channel = supabase
        .channel("provider-jobs-page-" + user.id)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "jobs",
            filter: `provider_id=eq.${user.id}`,
          },
          (payload) => {
            if (payload.eventType === "INSERT") {
              setJobs((prev) => [payload.new, ...prev]);
            }

            if (payload.eventType === "UPDATE") {
              setJobs((prev) =>
                prev.map((job) =>
                  job.id === payload.new.id ? payload.new : job
                )
              );
            }
          }
        )
        .subscribe();
    }

    loadJobs();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  async function markProviderCompleted(jobId) {
    setError("");
    setLoadingJobId(jobId);

    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user) {
      setError("Not authenticated");
      setLoadingJobId(null);
      return;
    }

    const { error } = await supabase
      .from("jobs")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", jobId)
      .eq("provider_id", user.id)
      .eq("status", "in_progress");

    setLoadingJobId(null);

    if (error) {
      setError(error.message || "Failed to mark job as completed");
    }
  }

  const filteredJobs =
    filter === "all"
      ? jobs
      : jobs.filter((job) => job.status === filter);

  return (
    <ProviderLayout>
      <div className="min-h-screen bg-[#eef1f6]">
        <main className="flex-1 px-6 py-6">
          <ProviderHeader name={name} />

          <div className="mb-4">
            <h2 className="text-xl font-bold text-[#0b1220]">Job Requests</h2>
            <p className="text-sm text-gray-500">
              Manage and respond to service requests from clients.
            </p>
          </div>

          {/* FILTERS */}
          <div className="flex gap-2 mb-5 flex-wrap">
            {["all", "pending", "accepted", "in_progress", "completed"].map(
              (key) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
                    filter === key
                      ? "bg-[#0b1220] text-white"
                      : "bg-white text-gray-600 border"
                  }`}
                >
                  {key.toUpperCase()}
                </button>
              )
            )}
          </div>

          {error && (
            <div className="mb-4 text-sm text-red-600 bg-white p-3 rounded-xl border">
              {error}
            </div>
          )}

          <div className="space-y-3">
            {filteredJobs.length === 0 ? (
              <div className="text-sm text-gray-500 bg-white p-6 rounded-2xl border">
                No job requests found.
              </div>
            ) : (
              filteredJobs.map((job) => (
                <div
                  key={job.id}
                  className="bg-white rounded-2xl border p-4 space-y-3"
                >
                  <JobRequestCard job={job} />

                  {job.status === "in_progress" && (
                    <button
                      onClick={() => markProviderCompleted(job.id)}
                      disabled={loadingJobId === job.id}
                      className={`w-full py-2 rounded-xl text-sm font-semibold ${
                        loadingJobId === job.id
                          ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                          : "bg-green-600 text-white hover:bg-green-700"
                      }`}
                    >
                      {loadingJobId === job.id
                        ? "Marking completed..."
                        : "Mark work completed"}
                    </button>
                  )}

                  {job.status === "completed" && (
                    <div className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-xl px-3 py-2">
                      Job completed.
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </main>
      </div>
    </ProviderLayout>
  );
}

export default function ProviderJobs() {
  return (
    <RequireRole role="provider">
      <ProviderJobsContent />
    </RequireRole>
  );
}