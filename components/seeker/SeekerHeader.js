// 🔒 AUTH LOCKED – DO NOT MODIFY AUTH LOGIC
// UI-only header component for Seeker dashboard
// REAL-TIME unread messages indicator

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { MessageSquare } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

export default function SeekerHeader() {
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let channel;

    async function loadUnread() {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;
      if (!user) return;

      // 1) Initial unread count
      const { count, error } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("receiver_id", user.id)
        .eq("is_read", false);

      if (!error) setUnreadCount(count || 0);

      // 2) Realtime updates
      channel = supabase
        .channel("seeker-unread-messages-" + user.id)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "messages",
            filter: `receiver_id=eq.${user.id}`,
          },
          async () => {
            const { count: newCount, error: e2 } = await supabase
              .from("messages")
              .select("id", { count: "exact", head: true })
              .eq("receiver_id", user.id)
              .eq("is_read", false);

            if (!e2) setUnreadCount(newCount || 0);
          }
        )
        .subscribe();
    }

    loadUnread();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="flex items-center justify-between mb-6">
      {/* LEFT */}
      <div>
        <h1 className="text-2xl font-bold text-[#0B1220]">Welcome back</h1>
        <p className="text-sm text-gray-500 mt-1">
          Here’s what’s happening with your requests today.
        </p>
      </div>

      {/* RIGHT – MESSAGES */}
      <button
        onClick={() => router.push("/seeker/messages")}
        className="relative p-3 rounded-2xl bg-white border shadow-sm hover:shadow transition"
        aria-label="Open messages"
      >
        <MessageSquare size={22} className="text-[#0B1220]" />

        {unreadCount > 0 && (
          <span
            className="
              absolute -top-2 -right-2
              min-w-[18px] h-[18px]
              px-1
              flex items-center justify-center
              rounded-full
              text-[10px] font-bold
              bg-[#e5e7eb] text-[#0B1220]
              shadow
            "
          >
            {unreadCount}
          </span>
        )}
      </button>
    </div>
  );
}