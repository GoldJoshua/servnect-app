// pages/support/index.js
// 🔒 AUTH LOCKED – Support dashboard entry point (LIVE)

import { useEffect, useMemo, useState } from "react";
import RequireSupport from "../../components/auth/RequireSupport";
import SupportLayout from "../../components/support/SupportLayout";
import { supabase } from "../../lib/supabaseClient";

export default function SupportOverview() {
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState([]);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);

      const { data, error } = await supabase
        .from("support_tickets")
        .select("id, status, priority, created_at")
        .order("created_at", { ascending: false });

      if (!active) return;

      if (error) {
        console.error("SupportOverview load error:", error);
        setTickets([]);
        setLoading(false);
        return;
      }

      setTickets(data || []);
      setLoading(false);
    }

    load();

    // 🔴 Realtime updates for dashboard stats
    const ch = supabase
      .channel("support-overview-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "support_tickets" },
        () => load()
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(ch);
    };
  }, []);

  const total = tickets.length;
  const open = useMemo(
    () => tickets.filter((t) => t.status === "open").length,
    [tickets]
  );
  const resolved = useMemo(
    () =>
      tickets.filter((t) => t.status === "resolved" || t.status === "closed")
        .length,
    [tickets]
  );

  const priorityCounts = useMemo(() => {
    const counts = { critical: 0, high: 0, medium: 0, low: 0 };
    for (const t of tickets) {
      const p = (t.priority || "").toLowerCase();
      if (counts[p] !== undefined) counts[p] += 1;
    }
    return counts;
  }, [tickets]);

  return (
    <RequireSupport>
      <SupportLayout>
        <div className="p-6">
          <h1 className="text-2xl font-black text-black">Support Dashboard</h1>
          <p className="text-sm text-black/60 mt-1">
            Welcome back. Here’s today’s support activity.
          </p>

          {/* STATS */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <StatCard title="Total Tickets" value={loading ? "…" : total} />
            <StatCard title="Open Tickets" value={loading ? "…" : open} />
            <StatCard
              title="Resolved Tickets"
              value={loading ? "…" : resolved}
            />
            <StatCard title="Avg. Response Time" value="—" />
          </div>

          {/* PANELS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
            {/* CHART */}
            <div className="lg:col-span-2 bg-white border border-black/10 rounded-2xl p-6">
              <h3 className="text-sm font-black text-black mb-4">
                Incoming Ticket Volume
              </h3>
              <div className="h-48 flex items-center justify-center text-black/40 text-sm">
                Chart coming next
              </div>
            </div>

            {/* PRIORITY QUEUE */}
            <div className="bg-white border border-black/10 rounded-2xl p-6">
              <h3 className="text-sm font-black text-black mb-4">
                Priority Queue
              </h3>

              <ul className="space-y-3 text-sm">
                <li className="flex justify-between">
                  <span>Critical</span>
                  <span className="font-black">
                    {loading ? "…" : priorityCounts.critical}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span>High</span>
                  <span className="font-black">
                    {loading ? "…" : priorityCounts.high}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span>Medium</span>
                  <span className="font-black">
                    {loading ? "…" : priorityCounts.medium}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span>Low</span>
                  <span className="font-black">
                    {loading ? "…" : priorityCounts.low}
                  </span>
                </li>
              </ul>

              <button
                className="w-full mt-5 py-2 text-sm font-black border border-black rounded-xl hover:bg-black hover:text-white transition"
                onClick={() => (window.location.href = "/support/tickets")}
              >
                View Tickets
              </button>
            </div>
          </div>
        </div>
      </SupportLayout>
    </RequireSupport>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="bg-white border border-black/10 rounded-2xl p-5">
      <div className="text-sm text-black/60">{title}</div>
      <div className="text-2xl font-black text-black mt-1">{value}</div>
    </div>
  );
}