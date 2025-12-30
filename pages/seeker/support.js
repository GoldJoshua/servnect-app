// pages/seeker/support.js
// 🔒 AUTH LOCKED – DO NOT MODIFY AUTH LOGIC

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import RequireRole from "../../components/auth/RequireRole";
import SeekerLayout from "../../components/layouts/SeekerLayout";
import { supabase } from "../../lib/supabaseClient";

function SeekerSupportContent() {
  const router = useRouter();

  const [tab, setTab] = useState("new");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("medium");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [tickets, setTickets] = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);

  useEffect(() => {
    loadTickets();

    const ch = supabase
      .channel("seeker-support-tickets")
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
  }, []);

  async function loadTickets() {
    setTicketsLoading(true);

    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user) return;

    const { data } = await supabase
      .from("support_tickets")
      .select("id, created_at, status, priority, category, last_seeker_read_at")
      .eq("seeker_id", user.id)
      .order("created_at", { ascending: false });

    setTickets(data || []);
    setTicketsLoading(false);
  }

  const unreadCount = useMemo(
    () => tickets.filter((t) => !t.last_seeker_read_at).length,
    [tickets]
  );

  async function submitTicket() {
    setError("");

    if (!category || !message) {
      setError("Please fill all required fields.");
      return;
    }

    setLoading(true);

    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user) return;

    const { data: ticket } = await supabase
      .from("support_tickets")
      .insert({
        seeker_id: user.id,
        category,
        priority,
        status: "open",
        message,
        last_seeker_read_at: new Date().toISOString(),
      })
      .select()
      .single();

    await supabase.from("support_messages").insert({
      ticket_id: ticket.id,
      sender_role: "seeker",
      sender_id: user.id,
      message,
    });

    setLoading(false);
    router.push(`/seeker/support/${ticket.id}`);
  }

  return (
    <div className="px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-xl font-semibold mb-4">Support</h1>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab("new")}
            className={`px-3 py-2 rounded text-xs ${
              tab === "new" ? "bg-[#0b1220] text-white" : "bg-white border"
            }`}
          >
            New ticket
          </button>
          <button
            onClick={() => setTab("tickets")}
            className={`px-3 py-2 rounded text-xs ${
              tab === "tickets" ? "bg-[#0b1220] text-white" : "bg-white border"
            }`}
          >
            My tickets {unreadCount ? `(${unreadCount})` : ""}
          </button>
        </div>

        {tab === "new" ? (
          <div className="bg-white rounded-3xl p-6 border shadow">
            {error && (
              <div className="mb-4 text-xs text-red-600 bg-red-50 px-3 py-2 rounded">
                {error}
              </div>
            )}

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full mb-3 border px-3 py-2 rounded"
            >
              <option value="">Select category</option>
              <option value="payment">Payment</option>
              <option value="job">Job issue</option>
              <option value="provider">Provider issue</option>
              <option value="account">Account</option>
              <option value="warranty">Apply for 4-Month Warranty</option>
            </select>

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              placeholder="Describe your issue"
              className="w-full border px-3 py-2 rounded mb-4"
            />

            <button
              onClick={submitTicket}
              disabled={loading}
              className="bg-[#0b1220] text-white px-4 py-2 rounded text-sm"
            >
              {loading ? "Submitting…" : "Submit ticket"}
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-6 border shadow">
            {ticketsLoading ? (
              <p className="text-sm text-gray-500">Loading…</p>
            ) : tickets.length === 0 ? (
              <p className="text-sm text-gray-500">No tickets yet.</p>
            ) : (
              <div className="space-y-2">
                {tickets.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => router.push(`/seeker/support/${t.id}`)}
                    className="w-full text-left border px-4 py-3 rounded hover:bg-gray-50"
                  >
                    <div className="text-sm font-medium">
                      {t.category} · {t.priority}
                    </div>
                    <div className="text-xs text-gray-500">
                      Status: {t.status}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SeekerSupport() {
  return (
    <RequireRole role="seeker">
      <SeekerLayout>
        <SeekerSupportContent />
      </SeekerLayout>
    </RequireRole>
  );
}