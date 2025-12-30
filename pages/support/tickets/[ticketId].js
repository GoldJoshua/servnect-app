// pages/support/tickets/[ticketId].js
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import RequireRole from "../../../components/auth/RequireRole";
import { supabase } from "../../../lib/supabaseClient";

export default function SupportTicketChat() {
  const router = useRouter();
  const { ticketId } = router.query;

  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const bottomRef = useRef(null);

  useEffect(() => {
    if (!ticketId) return;

    loadAll();

    const ch = supabase
      .channel(`support-chat-${ticketId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "support_messages",
          filter: `ticket_id=eq.${ticketId}`,
        },
        async () => {
          // ✅ receiver-safe: always refetch to avoid missed realtime due to RLS edge cases
          await loadMessages();
          await markSupportRead();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "support_tickets",
          filter: `id=eq.${ticketId}`,
        },
        (payload) => setTicket(payload.new)
      )
      .subscribe();

    return () => supabase.removeChannel(ch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function loadAll() {
    await Promise.all([loadTicket(), loadMessages()]);
    await markSupportRead();
  }

  async function loadTicket() {
    const { data, error } = await supabase
      .from("support_tickets")
      .select("*")
      .eq("id", ticketId)
      .single();

    if (error) {
      console.error("loadTicket error:", error);
      setTicket(null);
    } else {
      setTicket(data);
    }

    setLoading(false);
  }

  async function loadMessages() {
    const { data, error } = await supabase
      .from("support_messages")
      .select("*")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("loadMessages error:", error);
      return;
    }

    setMessages(data || []);
  }

  async function markSupportRead() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("support_tickets")
      .update({ last_support_read_at: new Date().toISOString() })
      .eq("id", ticketId);
  }

  async function assignToMe() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("support_tickets")
      .update({ assigned_to: user.id, status: ticket?.status || "open" })
      .eq("id", ticketId);
  }

  async function updateStatus(status) {
    await supabase.from("support_tickets").update({ status }).eq("id", ticketId);
  }

  async function sendMessage() {
    if (!newMessage.trim()) return;

    const text = newMessage; // snapshot before clearing

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    // ✅ optimistic UI: show instantly
    const tempId = `temp-${Date.now()}`;
    const optimistic = {
      id: tempId,
      ticket_id: ticketId,
      sender_role: "support",
      sender_id: user.id,
      message: text,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimistic]);
    setNewMessage("");

    const { error } = await supabase.from("support_messages").insert({
      ticket_id: ticketId,
      sender_role: "support",
      sender_id: user.id,
      message: text,
    });

    if (error) {
      console.error("sendMessage error:", error);
      // rollback
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      alert("Message failed to send");
      return;
    }

    // ✅ ensure temp message is replaced by real DB message (receiver-safe)
    await loadMessages();
    await markSupportRead();
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading…
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Ticket not found.
      </div>
    );
  }

  return (
    <RequireRole role="support">
      <div className="min-h-screen bg-[#eef1f6] px-4 py-8">
        <div className="max-w-5xl mx-auto bg-white border border-gray-200 rounded-3xl p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-lg font-semibold">Ticket</h1>
              <p className="text-xs text-gray-500 mt-1">
                Category: {ticket.category} · Priority: {ticket.priority} · Status:{" "}
                {ticket.status}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push("/support/tickets")}
                className="text-xs px-3 py-2 rounded-lg border border-gray-200 bg-white"
              >
                Back
              </button>

              <button
                onClick={assignToMe}
                className="text-xs px-3 py-2 rounded-lg bg-[#0b1220] text-white"
              >
                Assign to me
              </button>

              <select
                value={ticket.status || "open"}
                onChange={(e) => updateStatus(e.target.value)}
                className="text-xs border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="open">Open</option>
                <option value="in_progress">In progress</option>
                <option value="waiting_for_seeker">Waiting for seeker</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>

          <div className="mt-6 h-[60vh] overflow-y-auto space-y-3">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`max-w-xl text-sm px-3 py-2 rounded-lg ${
                  m.sender_role === "support"
                    ? "bg-[#0b1220] text-white ml-auto"
                    : "bg-gray-50 border"
                }`}
              >
                <div className="text-[10px] opacity-70 mb-1">
                  {m.sender_role === "support" ? "Support" : "Seeker"} ·{" "}
                  {new Date(m.created_at).toLocaleString()}
                </div>
                {m.message}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <div className="mt-4 flex gap-2">
            <input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Reply…"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter") sendMessage();
              }}
            />
            <button
              onClick={sendMessage}
              className="bg-[#0b1220] text-white px-4 rounded-lg text-sm"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </RequireRole>
  );
}