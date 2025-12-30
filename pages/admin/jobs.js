import { useEffect, useState } from "react";
import RequireAdmin from "../../components/auth/RequireAdmin";
import AdminLayout from "../../components/admin/AdminLayout";
import { supabase } from "../../lib/supabaseClient";

export default function AdminJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let channel;

    async function loadJobs() {
      setLoading(true);

      const { data } = await supabase
        .from("jobs")
        .select(
          `
          id,
          service_title,
          status,
          created_at,
          seeker_id,
          provider_id
        `
        )
        .order("created_at", { ascending: false });

      setJobs(data || []);
      setLoading(false);

      // 🔴 REALTIME updates
      channel = supabase
        .channel("admin-jobs-realtime")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "jobs" },
          async () => {
            const { data } = await supabase
              .from("jobs")
              .select(
                "id, service_title, status, created_at, seeker_id, provider_id"
              )
              .order("created_at", { ascending: false });

            setJobs(data || []);
          }
        )
        .subscribe();
    }

    loadJobs();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  async function updateStatus(jobId, status) {
    await supabase.from("jobs").update({ status }).eq("id", jobId);

    setJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, status } : j))
    );
  }

  return (
    <RequireAdmin>
      <AdminLayout title="Jobs Moderation">
        <h1 className="text-2xl font-bold mb-6">Jobs Moderation</h1>

        {loading ? (
          <div className="text-gray-500">Loading jobs…</div>
        ) : jobs.length === 0 ? (
          <div className="bg-white p-6 rounded-xl border text-gray-500">
            No jobs found.
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="bg-white border rounded-2xl p-5 flex items-center justify-between"
              >
                {/* LEFT */}
                <div>
                  <p className="font-semibold text-[#0b1220]">
                    {job.service_title || "Service Job"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Status:{" "}
                    <span className="font-semibold uppercase">
                      {job.status}
                    </span>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Created:{" "}
                    {new Date(job.created_at).toLocaleString()}
                  </p>
                </div>

                {/* RIGHT – ACTIONS */}
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => updateStatus(job.id, "completed")}
                    disabled={job.status === "completed"}
                    className={`px-3 py-2 rounded text-sm font-semibold text-white
                      ${
                        job.status === "completed"
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-gray-600 hover:bg-gray-700"
                      }`}
                  >
                    Mark Completed
                  </button>

                  <button
                    onClick={() => updateStatus(job.id, "rejected")}
                    disabled={job.status === "rejected"}
                    className={`px-3 py-2 rounded text-sm font-semibold text-white
                      ${
                        job.status === "rejected"
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-gray-600 hover:bg-gray-700"
                      }`}
                  >
                    Cancel Job
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </AdminLayout>
    </RequireAdmin>
  );
}