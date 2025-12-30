// pages/provider/support/[ticketId].js
// 🔒 AUTH LOCKED – DO NOT MODIFY AUTH LOGIC
// UI layout updated to use ProviderLayout only

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import RequireRole from "../../../components/auth/RequireRole";
import ProviderLayout from "../../../components/layouts/ProviderLayout";
import ProviderHeader from "../../../components/provider/ProviderHeader";
import { supabase } from "../../../lib/supabaseClient";

export default function ProviderSupportChat() {
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
      .channel(`provider-support-${ticketId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "support_messages",
          filter: `ticket_id=eq.${ticketId}`,
        },
        async () => {
          await loadMessages();
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
  }, [ticketId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function loadAll() {
    await Promise.all([loadTicket(), loadMessages()]);
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

  async function sendMessage() {
    if (!newMessage.trim()) return;

    const text = newMessage;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    const tempId = `temp-${Date.now()}`;
    const optimistic = {
      id: tempId,
      ticket_id: ticketId,
      sender_role: "provider",
      sender_id: user.id,
      message: text,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimistic]);
    setNewMessage("");

    const { error } = await supabase.from("support_messages").insert({
      ticket_id: ticketId,
      sender_role: "provider",
      sender_id: user.id,
      message: text,
    });

    if (error) {
      console.error("PROVIDER SEND ERROR:", error);
      alert("Message failed to send.");
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      return;
    }

    await loadMessages();
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
    <RequireRole role="provider">
      <ProviderLayout>
        <ProviderHeader />

        <div className="mb-4">
          <h2 className="text-lg font-semibold">Support Ticket</h2>
          <p className="text-xs text-gray-500">
            Status: {ticket.status} · Priority: {ticket.priority}
          </p>
        </div>

        <div className="h-[60vh] overflow-y-auto space-y-3 bg-white border rounded-xl p-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`max-w-md text-sm px-3 py-2 rounded-lg ${
                m.sender_role === "provider"
                  ? "bg-[#0b1220] text-white ml-auto"
                  : "bg-gray-100 border"
              }`}
            >
              <div className="text-[10px] opacity-70 mb-1">
                {m.sender_role === "provider" ? "You" : "Support"}
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
            placeholder="Type a message…"
            className="flex-1 border rounded-lg px-3 py-2 text-sm"
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <button
            onClick={sendMessage}
            className="bg-[#0b1220] text-white px-4 rounded-lg text-sm"
          >
            Send
          </button>
        </div>
      </ProviderLayout>
    </RequireRole>
  );
}