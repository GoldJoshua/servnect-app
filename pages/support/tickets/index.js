import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import SupportLayout from "../../../components/support/SupportLayout";
import {
  StatusBadge,
  PriorityBadge,
} from "../../../components/support/TicketBadges";
import RequireSupport from "../../../components/auth/RequireSupport";
import { supabase } from "../../../lib/supabaseClient";

export default function TicketsPage() {
  const router = useRouter();

  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  // 🔹 LOAD TICKETS + REALTIME
  useEffect(() => {
    let channel;

    async function loadTickets() {
      setLoading(true);

      const { data, error } = await supabase
        .from("support_tickets") // ✅ CORRECT TABLE
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setTickets(data);
      }

      setLoading(false);

      // 🔴 REALTIME SUBSCRIPTION (CORRECT TABLE)
      channel = supabase
        .channel("support-tickets-realtime")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "support_tickets",
          },
          (payload) => {
            if (payload.eventType === "INSERT") {
              setTickets((prev) => [payload.new, ...prev]);
            }

            if (payload.eventType === "UPDATE") {
              setTickets((prev) =>
                prev.map((t) =>
                  t.id === payload.new.id ? payload.new : t
                )
              );
            }

            if (payload.eventType === "DELETE") {
              setTickets((prev) =>
                prev.filter((t) => t.id !== payload.old.id)
              );
            }
          }
        )
        .subscribe();
    }

    loadTickets();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  const filteredTickets = useMemo(() => {
    if (filter === "all") return tickets;
    return tickets.filter((t) => t.status === filter);
  }, [tickets, filter]);

  return (
    <RequireSupport>
      <SupportLayout>
        <div className="p-6">
          {/* HEADER */}
          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black">Tickets</h1>
              <p className="text-sm text-black/60 mt-1">
                Support ticket management (realtime)
              </p>
            </div>

            <div className="flex gap-2">
              {["all", "open", "in_progress", "resolved"].map((k) => (
                <button
                  key={k}
                  onClick={() => setFilter(k)}
                  className={`px-4 py-2 rounded-xl text-xs font-black border transition
                    ${
                      filter === k
                        ? "bg-black text-white border-black"
                        : "bg-white text-black border-black/15 hover:bg-black/5"
                    }`}
                >
                  {k === "in_progress" ? "IN PROGRESS" : k.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* TABLE */}
          <div className="mt-6 bg-white border border-black/10 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-white border-b border-black/10">
                  <tr className="text-left">
                    <th className="px-5 py-4 font-black">Message</th>
                    <th className="px-5 py-4 font-black">Category</th>
                    <th className="px-5 py-4 font-black">Status</th>
                    <th className="px-5 py-4 font-black">Priority</th>
                    <th className="px-5 py-4 font-black">Assignee</th>
                    <th className="px-5 py-4 font-black">Created</th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-10 text-black/60">
                        Loading tickets…
                      </td>
                    </tr>
                  ) : filteredTickets.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-10 text-black/60">
                        No tickets found.
                      </td>
                    </tr>
                  ) : (
                    filteredTickets.map((t) => (
                      <tr
                        key={t.id}
                        className="border-b border-black/5 hover:bg-black/5 cursor-pointer"
                        onClick={() =>
                          router.push(`/support/tickets/${t.id}`)
                        }
                      >
                        <td className="px-5 py-4 font-semibold">
                          {t.message || "—"}
                        </td>
                        <td className="px-5 py-4 text-black/70">
                          {t.category || "—"}
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge status={t.status} />
                        </td>
                        <td className="px-5 py-4">
                          <PriorityBadge priority={t.priority} />
                        </td>
                        <td className="px-5 py-4 text-black/70">
                          {t.assigned_to ? "Assigned" : "Unassigned"}
                        </td>
                        <td className="px-5 py-4 text-black/70">
                          {new Date(t.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </SupportLayout>
    </RequireSupport>
  );
}