// components/provider/JobRequestCard.js
// 🔒 AUTH LOCKED – DO NOT MODIFY AUTH LOGIC
// Provider Job Request Card

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { MapPin, Clock, Check } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

export default function JobRequestCard({ job }) {
  const router = useRouter();

  const [jobData, setJobData] = useState(job);
  const [loading, setLoading] = useState(false);

  // Provider rules modal
  const [showRules, setShowRules] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // "accept" | "complete"

  // Realtime updates for this job
  useEffect(() => {
    const channel = supabase
      .channel(`job-${job.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "jobs",
          filter: `id=eq.${job.id}`,
        },
        (payload) => {
          setJobData(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [job.id]);

  // ACCEPT JOB
  async function acceptJob() {
    if (loading || jobData.status !== "pending") return;

    setLoading(true);

    const { error } = await supabase
      .from("jobs")
      .update({
        status: "accepted",
        accepted_at: new Date().toISOString(),
      })
      .eq("id", jobData.id);

    setLoading(false);

    if (error) {
      alert("Failed to accept job");
      return;
    }

    router.push(`/chat/${jobData.id}`);
  }

  // PROVIDER COMPLETES JOB (FINAL)
  async function markProviderCompleted() {
    if (loading || !["accepted", "in_progress"].includes(jobData.status))
      return;

    setLoading(true);

    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) {
      alert("Not authenticated");
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from("jobs")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", jobData.id)
      .eq("provider_id", auth.user.id);

    setLoading(false);

    if (error) {
      alert(error.message || "Failed to complete job");
    }
  }

  return (
    <>
      {/* PROVIDER RULES MODAL */}
      {showRules && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="font-semibold text-lg mb-3">Provider Rules</h3>

            <div className="text-sm space-y-2 text-gray-700">
              <p>
                🚫 Do <strong>NOT</strong> attempt to take seekers off the
                platform.
              </p>
              <p>
                ⚠️ Violations can lead to account suspension and loss of access
                to millions of customers.
              </p>
            </div>

            <div className="mt-5 flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowRules(false);
                  setPendingAction(null);
                }}
                className="px-4 py-2 text-sm rounded-xl border"
              >
                Cancel
              </button>

              <button
                onClick={() => {
                  setShowRules(false);

                  if (pendingAction === "accept") acceptJob();
                  if (pendingAction === "complete") markProviderCompleted();

                  setPendingAction(null);
                }}
                className="px-4 py-2 text-sm rounded-xl bg-[#0b1220] text-white font-semibold"
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CARD */}
      <div className="bg-white rounded-2xl p-5 border shadow">
        {/* HEADER */}
        <div className="flex justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold">
              {jobData.service_title || "Service request"}
            </h3>

            <div className="flex gap-3 text-xs text-gray-500 mt-1">
              <span className="flex items-center gap-1">
                <MapPin size={12} />
                {jobData.address || "Location not set"}
              </span>

              <span className="flex items-center gap-1">
                <Clock size={12} />
                {jobData.scheduled_at
                  ? new Date(jobData.scheduled_at).toLocaleString()
                  : "Flexible"}
              </span>
            </div>
          </div>

          <span className="text-[11px] px-3 py-1 rounded-full bg-gray-100 text-gray-600">
            {jobData.status.toUpperCase()}
          </span>
        </div>

        {/* ACTIONS */}
        <div className="flex gap-2">
          <button
            disabled={jobData.status !== "pending" || loading}
            onClick={() => {
              setPendingAction("accept");
              setShowRules(true);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold ${
              jobData.status === "pending"
                ? "bg-gray-700 text-white"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            <Check size={14} /> Accept
          </button>

          <button
            disabled={
              !["accepted", "in_progress"].includes(jobData.status) || loading
            }
            onClick={() => {
              setPendingAction("complete");
              setShowRules(true);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold ${
              ["accepted", "in_progress"].includes(jobData.status)
                ? "bg-[#0b1220] text-white"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            Mark Completed
          </button>
        </div>
      </div>
    </>
  );
}