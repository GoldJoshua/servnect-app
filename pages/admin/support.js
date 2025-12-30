import { useEffect, useState } from "react";
import RequireAdmin from "../../components/auth/RequireAdmin";
import AdminLayout from "../../components/admin/AdminLayout";
import { supabase } from "../../lib/supabaseClient";
import { MessageSquare, AlertTriangle } from "lucide-react";

export default function AdminSupport() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let channel;

    async function loadTickets() {
      setLoading(true);

      /**
       * SUPPORT LOGIC:
       * For now, we treat disputes / support tickets as:
       * - Jobs with status = 'disputed'
       * - OR messages flagged later
       *
       * This works immediately with your current DB.
       */
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
        .eq("status", "disputed")
        .order("created_at", { ascending: false });

      setTickets(data || []);
      setLoading(false);

      // 🔴 REALTIME updates
      channel = supabase
        .channel("admin-support-realtime")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "jobs" },
          async () => {
            const { data } = await supabase
              .from("jobs")
              .select(
                "id, service_title, status, created_at, seeker_id, provider_id"
              )
              .eq("status", "disputed")
              .order("created_at", { ascending: false });

            setTickets(data || []);
          }
        )
        .subscribe();
    }

    loadTickets();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  async function resolveDispute(jobId) {
    await supabase
      .from("jobs")
      .update({ status: "completed" })
      .eq("id", jobId);

    setTickets((prev) => prev.filter((t) => t.id !== jobId));
  }

  async function cancelJob(jobId) {
    await supabase
      .from("jobs")
      .update({ status: "rejected" })
      .eq("id", jobId);

    setTickets((prev) => prev.filter((t) => t.id !== jobId));
  }

  return (
    <RequireAdmin>
      <AdminLayout title="Support Center">
        <h1 className="text-2xl font-bold mb-6">
          Support & Dispute Resolution
        </h1>

        {loading ? (
          <div className="text-gray-500">Loading support tickets…</div>
        ) : tickets.length === 0 ? (
          <div className="bg-white border rounded-2xl p-6 text-gray-500">
            No open disputes or support tickets.
          </div>
        ) : (
          <div className="space-y-4">
            {tickets.map((t) => (
              <div
                key={t.id}
                className="bg-white border rounded-2xl p-5 flex justify-between gap-6"
              >
                {/* LEFT */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="text-orange-500" size={18} />
                    <span className="font-semibold text-[#0b1220]">
                      {t.service_title || "Disputed Job"}
                    </span>
                  </div>

                  <div className="text-xs text-gray-400 mt-2">
                    Job ID: {t.id}
                  </div>

                  <div className="text-xs text-gray-400 mt-1">
                    Opened:{" "}
                    {new Date(t.created_at).toLocaleString()}
                  </div>
                </div>

                {/* ACTIONS */}
                <div className="flex gap-2">
                  <button
                    onClick={() => resolveDispute(t.id)}
                    className="px-4 py-2 rounded-xl bg-gray-600 text-white text-sm font-semibold hover:bg-gray-700"
                  >
                    Resolve
                  </button>

                  <button
                    onClick={() => cancelJob(t.id)}
                    className="px-4 py-2 rounded-xl bg-gray-600 text-white text-sm font-semibold hover:bg-gray-700"
                  >
                    Cancel Job
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* FUTURE EXTENSION NOTE */}
        <div className="mt-10 text-xs text-gray-400">
          This dashboard will automatically extend to:
          flagged messages, user complaints, and live admin–user chats.
        </div>
      </AdminLayout>
    </RequireAdmin>
  );
}