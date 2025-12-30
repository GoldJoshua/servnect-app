// components/support/TicketChat.js
// 🔒 Support Ticket Chat (Realtime via Supabase)
// - Reads from ticket_messages
// - Inserts messages
// - Realtime updates
// - Auto-scroll
// - Black & white support theme

import { useEffect, useRef, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

export default function TicketChat({ ticketId }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [user, setUser] = useState(null);
  const bottomRef = useRef(null);

  // 🔹 Load user + messages + realtime
  useEffect(() => {
    if (!ticketId) return;

    let channel;

    async function init() {
      // 1️⃣ Get logged-in user
      const { data: auth } = await supabase.auth.getUser();
      if (!auth?.user) return;
      setUser(auth.user);

      // 2️⃣ Load existing messages
      const { data, error } = await supabase
        .from("ticket_messages")
        .select("*")
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true });

      if (!error && data) {
        setMessages(data);
        scrollToBottom();
      }

      // 3️⃣ Realtime subscription
      channel = supabase
        .channel("ticket-chat-" + ticketId)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "ticket_messages",
            filter: `ticket_id=eq.${ticketId}`,
          },
          (payload) => {
            setMessages((prev) => [...prev, payload.new]);
            scrollToBottom();
          }
        )
        .subscribe();
    }

    init();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [ticketId]);

  function scrollToBottom() {
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  }

  // 🔹 Send message
  async function sendMessage() {
    if (!text.trim() || !user) return;

    const message = text.trim();
    setText("");

    await supabase.from("ticket_messages").insert({
      ticket_id: ticketId,
      sender_id: user.id,
      sender_role: "support", // IMPORTANT
      message,
    });
  }

  function onKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="flex flex-col h-full bg-white border border-black/10 rounded-2xl">
      {/* HEADER */}
      <div className="px-5 py-3 border-b border-black/10">
        <h3 className="text-sm font-black">Ticket Conversation</h3>
      </div>

      {/* MESSAGES */}
      <div className="flex-1 p-5 space-y-4 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="text-sm text-black/50">
            No messages yet.
          </div>
        ) : (
          messages.map((m) => {
            const isSupport = m.sender_role === "support";

            return (
              <div
                key={m.id}
                className={`max-w-lg text-sm px-4 py-3 rounded-xl ${
                  isSupport
                    ? "ml-auto bg-black text-white"
                    : "bg-gray-100 text-black"
                }`}
              >
                <div className="whitespace-pre-wrap">
                  {m.message}
                </div>
                <div
                  className={`mt-1 text-[10px] ${
                    isSupport ? "text-white/70" : "text-black/50"
                  }`}
                >
                  {new Date(m.created_at).toLocaleString()}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* INPUT */}
      <div className="p-4 border-t border-black/10 flex gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Type a reply…"
          rows={1}
          className="flex-1 resize-none px-4 py-2 border border-black/20 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-black"
        />
        <button
          onClick={sendMessage}
          className="px-5 py-2 bg-black text-white rounded-xl text-sm font-black hover:opacity-90"
        >
          Send
        </button>
      </div>
    </div>
  );
}