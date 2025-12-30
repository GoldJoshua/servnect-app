// pages/seeker/support/[ticketId].js
// 🔒 AUTH LOCKED – DO NOT MODIFY AUTH LOGIC

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import RequireRole from "../../../components/auth/RequireRole";
import SeekerLayout from "../../../components/layouts/SeekerLayout";
import { supabase } from "../../../lib/supabaseClient";

export default function SupportTicketPage() {
  return (
    <RequireRole role="seeker">
      <SupportTicketContent />
    </RequireRole>
  );
}

function SupportTicketContent() {
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

    const channel = supabase
      .channel(`support-realtime-${ticketId}`)
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
          await markSeekerRead();
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
        (payload) => {
          setTicket(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function loadAll() {
    await Promise.all([loadTicket(), loadMessages()]);
    await markSeekerRead();
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

  async function markSeekerRead() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("support_tickets")
      .update({ last_seeker_read_at: new Date().toISOString() })
      .eq("id", ticketId)
      .eq("seeker_id", user.id);
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
      sender_role: "seeker",
      sender_id: user.id,
      message: text,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimistic]);
    setNewMessage("");

    const { error } = await supabase.from("support_messages").insert({
      ticket_id: ticketId,
      sender_role: "seeker",
      sender_id: user.id,
      message: text,
    });

    if (error) {
      console.error("sendMessage error:", error);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      alert("Message failed to send");
      return;
    }

    await loadMessages();
    await markSeekerRead();
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading ticket…
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
    <SeekerLayout>
      <div className="min-h-screen flex bg-[#eef1f6]">
        <div className="flex-1 flex flex-col min-h-screen">
          <header className="px-4 lg:px-8 py-4 border-b border-gray-200 bg-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-semibold">Support Ticket</h1>
                <p className="text-xs text-gray-500">
                  Status: {ticket.status} · Priority: {ticket.priority} ·
                  Category: {ticket.category}
                </p>
              </div>

              <button
                onClick={() => router.push("/seeker/support")}
                className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 bg-white"
              >
                Back
              </button>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 flex flex-col">
            <div className="flex-1 space-y-3 overflow-y-auto">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`max-w-md text-sm px-3 py-2 rounded-lg ${
                    msg.sender_role === "seeker"
                      ? "bg-[#0b1220] text-white ml-auto"
                      : "bg-white border"
                  }`}
                >
                  <div className="text-[10px] opacity-70 mb-1">
                    {msg.sender_role === "seeker" ? "You" : "Support"} ·{" "}
                    {new Date(msg.created_at).toLocaleString()}
                  </div>
                  {msg.message}
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            <div className="mt-4 flex gap-2">
              <input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message…"
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
          </main>
        </div>
      </div>
    </SeekerLayout>
  );
}