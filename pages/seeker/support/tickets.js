// pages/support/tickets.js
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import RequireRole from "@/components/auth/RequireRole";
import { supabase } from "@/lib/supabaseClient";

export default function SupportTicketsPage() {
  const router = useRouter();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    loadTickets();

    const ch = supabase
      .channel("support-tickets-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "support_tickets" },
        () => loadTickets()
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "support_messages" },
        () => loadTickets()
      )
      .subscribe();

    return () => supabase.removeChannel(ch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadTickets() {
    setLoading(true);

    const { data: t } = await supabase
      .from("support_tickets")
      .select("id, created_at, status, priority, category, seeker_id, provider_id, assigned_to, last_support_read_at")
      .order("created_at", { ascending: false });

    // unread for support = latest seeker msg > last_support_read_at
    const ids = (t || []).map((x) => x.id);
    let latestSeeker = {};
    if (ids.length) {
      const { data: msgs } = await supabase
        .from("support_messages")
        .select("ticket_id, sender_role, created_at")
        .in("ticket_id", ids)
        .order("created_at", { ascending: false });

      for (const m of msgs || []) {
        if (m.sender_role !== "seeker") continue;
        if (!latestSeeker[m.ticket_id]) latestSeeker[m.ticket_id] = m.created_at;
      }
    }

    const enriched = (t || []).map((x) => {
      const lastSeekerMsgAt = latestSeeker[x.id] || null;
      const lastRead = x.last_support_read_at || null;
      const unread =
        !!lastSeekerMsgAt &&
        (!lastRead || new Date(lastSeekerMsgAt).getTime() > new Date(lastRead).getTime());
      return { ...x, unread };
    });

    setTickets(enriched);
    setLoading(false);
  }

  const filtered = useMemo(() => {
    if (statusFilter === "all") return tickets;
    return tickets.filter((t) => t.status === statusFilter);
  }, [tickets, statusFilter]);

  return (
    <RequireRole role="support">
      <div className="min-h-screen bg-[#eef1f6] px-4 py-8">
        <div className="max-w-5xl mx-auto bg-white border border-gray-200 rounded-3xl p-6">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold">Support Tickets</h1>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="all">All</option>
              <option value="open">Open</option>
              <option value="in_progress">In progress</option>
              <option value="waiting_for_seeker">Waiting for seeker</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <div className="mt-4">
            {loading ? (
              <div className="text-sm text-gray-500">Loading…</div>
            ) : filtered.length === 0 ? (
              <div className="text-sm text-gray-500">No tickets.</div>
            ) : (
              <div className="space-y-2">
                {filtered.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => router.push(`/support/tickets/${t.id}`)}
                    className="w-full text-left border border-gray-200 rounded-2xl px-4 py-3 hover:bg-gray-50"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">
                        {t.category} · {t.priority} · {t.status}
                      </div>
                      {t.unread && (
                        <span className="text-[10px] px-2 py-1 rounded-full bg-red-100 text-red-700">
                          Unread
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Created: {new Date(t.created_at).toLocaleString()}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </RequireRole>
  );
}