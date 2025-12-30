// pages/support/analytics.js
import { useEffect, useMemo, useState } from "react";
import RequireSupport from "../../components/auth/RequireSupport";
import SupportLayout from "../../components/support/SupportLayout";
import { supabase } from "../../lib/supabaseClient";

export default function SupportAnalytics() {
  const [range, setRange] = useState(7);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);

      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - range);

      const { data, error } = await supabase
        .from("support_tickets")
        .select("id, priority, created_at")
        .gte("created_at", fromDate.toISOString());

      if (!active) return;

      if (error) {
        console.error("Analytics load error:", error);
        setTickets([]);
      } else {
        setTickets(data || []);
      }

      setLoading(false);
    }

    load();

    return () => {
      active = false;
    };
  }, [range]);

  const priorityCounts = useMemo(() => {
    const counts = { critical: 0, high: 0, medium: 0, low: 0 };
    tickets.forEach((t) => {
      const p = (t.priority || "").toLowerCase();
      if (counts[p] !== undefined) counts[p] += 1;
    });
    return counts;
  }, [tickets]);

  return (
    <RequireSupport>
      <SupportLayout>
        <div className="p-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black">Analytics</h1>
              <p className="text-sm text-black/60 mt-1">
                Ticket volume + priority breakdown.
              </p>
            </div>

            <div className="flex gap-2">
              {[7, 30, 180].map((d) => (
                <button
                  key={d}
                  onClick={() => setRange(d)}
                  className={`px-4 py-2 rounded-xl text-xs font-black border transition
                    ${
                      range === d
                        ? "bg-black text-white border-black"
                        : "bg-white text-black border-black/15 hover:bg-black/5"
                    }`}
                >
                  LAST {d} DAYS
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            <div className="lg:col-span-2 bg-white border border-black/10 rounded-2xl p-6">
              <div className="text-sm font-black mb-4">
                Incoming Ticket Volume
              </div>

              <div className="h-56 flex items-center justify-center text-black/40 text-sm">
                {loading
                  ? "Loading…"
                  : `${tickets.length} tickets in last ${range} days`}
              </div>
            </div>

            <div className="bg-white border border-black/10 rounded-2xl p-6">
              <div className="text-sm font-black mb-4">
                Priority Breakdown
              </div>

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
            </div>
          </div>
        </div>
      </SupportLayout>
    </RequireSupport>
  );
}