// pages/seeker/messages.js
// 🔒 AUTH LOCKED – DO NOT MODIFY AUTH LOGIC
// Seeker Messages Inbox – REAL DB + REALTIME

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import RequireRole from "../../components/auth/RequireRole";
import SeekerLayout from "../../components/layouts/SeekerLayout";
import { supabase } from "../../lib/supabaseClient";
import { MessageSquare } from "lucide-react";

function SeekerMessagesContent() {
  const router = useRouter();
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let channel;

    async function loadInbox() {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;
      if (!user) return;

      const { data } = await supabase.rpc(
        "seeker_message_threads",
        { p_user_id: user.id }
      );

      setThreads(data || []);

      channel = supabase
        .channel("seeker-inbox-" + user.id)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `receiver_id=eq.${user.id}`,
          },
          async () => {
            const { data: fresh } = await supabase.rpc(
              "seeker_message_threads",
              { p_user_id: user.id }
            );
            setThreads(fresh || []);
          }
        )
        .subscribe();

      setLoading(false);
    }

    loadInbox();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="px-6 py-6">
      <h1 className="text-2xl font-bold text-[#0B1220] mb-2">
        Messages
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        Conversations update in real time.
      </p>

      {loading ? (
        <div className="text-gray-500">Loading conversations…</div>
      ) : threads.length === 0 ? (
        <div className="bg-white rounded-2xl p-6 border text-sm text-gray-500">
          No conversations yet.
        </div>
      ) : (
        <div className="space-y-3">
          {threads.map((t) => (
            <button
              key={t.job_id}
              onClick={() => router.push(`/chat/${t.job_id}`)}
              className="w-full bg-white rounded-2xl p-5 border
                         shadow hover:shadow-md transition
                         flex items-center justify-between"
            >
              <div className="flex items-start gap-3">
                <div className="p-3 rounded-xl bg-[#0B1220]/10">
                  <MessageSquare size={18} className="text-[#0B1220]" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold">{t.service_title}</p>
                  <p className="text-xs text-gray-500 truncate max-w-xs">
                    {t.last_message}
                  </p>
                </div>
              </div>

              {t.unread_count > 0 && (
                <span className="min-w-[22px] h-[22px] px-1 flex items-center justify-center
                                 rounded-full text-[11px] font-bold bg-gray-200">
                  {t.unread_count}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SeekerMessages() {
  return (
    <RequireRole role="seeker">
      <SeekerLayout>
        <SeekerMessagesContent />
      </SeekerLayout>
    </RequireRole>
  );
}