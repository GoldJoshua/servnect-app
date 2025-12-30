// 🔒 AUTH LOCKED – DO NOT MODIFY AUTH LOGIC
// Provider Messages Inbox – REAL DB + REALTIME

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import RequireRole from "../../components/auth/RequireRole";
import ProviderLayout from "../../components/layouts/ProviderLayout";
import ProviderHeader from "../../components/provider/ProviderHeader";
import { supabase } from "../../lib/supabaseClient";
import { MessageSquare } from "lucide-react";

function ProviderMessagesContent() {
  const router = useRouter();
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let channel;

    async function loadInbox() {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;
      if (!user) return;

      // 1️⃣ Load provider message threads
      const { data, error } = await supabase.rpc(
        "provider_message_threads",
        { p_user_id: user.id }
      );

      if (!error && data) {
        setThreads(data);
      }

      // 2️⃣ Realtime updates (new messages)
      channel = supabase
        .channel("provider-inbox-" + user.id)
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
              "provider_message_threads",
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
    <ProviderLayout>
      <div className="min-h-screen bg-[#eef1f6]">
        <main className="flex-1 px-6 py-6">
          <ProviderHeader />

          {/* HEADER */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[#0B1220]">
              Messages
            </h1>
            <p className="text-sm text-gray-500">
              Conversations update in real time.
            </p>
          </div>

          {/* INBOX */}
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
                      <MessageSquare
                        size={18}
                        className="text-[#0B1220]"
                      />
                    </div>

                    <div className="text-left">
                      <p className="text-sm font-semibold text-[#0B1220]">
                        {t.service_title}
                      </p>
                      <p className="text-xs text-gray-500 mt-1 truncate max-w-xs">
                        {t.last_message}
                      </p>
                    </div>
                  </div>

                  {/* UNREAD BADGE */}
                  {t.unread_count > 0 && (
                    <span
                      className="
                        min-w-[22px] h-[22px]
                        px-1
                        flex items-center justify-center
                        rounded-full
                        text-[11px] font-bold
                        bg-[#e5e7eb] text-[#0B1220]
                      "
                    >
                      {t.unread_count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </main>
      </div>
    </ProviderLayout>
  );
}

export default function ProviderMessages() {
  return (
    <RequireRole role="provider">
      <ProviderMessagesContent />
    </RequireRole>
  );
}