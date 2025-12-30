// 🔒 AUTH LOCKED – DO NOT MODIFY AUTH LOGIC
// UI-only header component for Provider dashboard
// REAL-TIME unread messages indicator + LIVE RATING DISPLAY
// 🔔 IN-APP NOTIFICATIONS (role approvals / declines)

import { useEffect, useState } from "react";
import { MessageSquare, Star, Bell } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

export default function ProviderHeader() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [rating, setRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);

  // 🔔 Notifications
  const [notifCount, setNotifCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);

  useEffect(() => {
    let channel;

    async function loadHeaderData() {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;
      if (!user) return;

      /* -------------------------------
       * UNREAD MESSAGES
       * ------------------------------- */
      const { count } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("receiver_id", user.id)
        .eq("is_read", false);

      setUnreadCount(count || 0);

      /* -------------------------------
       * PROVIDER RATING (REAL DATA)
       * ------------------------------- */
      const { data: profile } = await supabase
        .from("profiles")
        .select("rating, review_count")
        .eq("id", user.id)
        .single();

      if (profile) {
        setRating(profile.rating || 0);
        setReviewCount(profile.review_count || 0);
      }

      /* -------------------------------
       * UNREAD NOTIFICATIONS
       * ------------------------------- */
      const { count: nCount } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("read", false);

      setNotifCount(nCount || 0);

      /* -------------------------------
       * REALTIME UPDATES (MESSAGES + NOTIFICATIONS)
       * ------------------------------- */
      channel = supabase
        .channel("provider-header-" + user.id)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "messages",
            filter: `receiver_id=eq.${user.id}`,
          },
          async () => {
            const { count: newCount } = await supabase
              .from("messages")
              .select("id", { count: "exact", head: true })
              .eq("receiver_id", user.id)
              .eq("is_read", false);

            setUnreadCount(newCount || 0);
          }
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          async () => {
            const { count: newNotifCount } = await supabase
              .from("notifications")
              .select("id", { count: "exact", head: true })
              .eq("user_id", user.id)
              .eq("read", false);

            setNotifCount(newNotifCount || 0);
          }
        )
        .subscribe();
    }

    loadHeaderData();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  async function openNotifications() {
    setShowNotifs((prev) => !prev);

    if (!showNotifs) {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;
      if (!user) return;

      const { data } = await supabase
        .from("notifications")
        .select("id, title, body, created_at, read")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      setNotifications(data || []);

      // mark unread as read
      await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", user.id)
        .eq("read", false);

      setNotifCount(0);
    }
  }

  return (
    <div className="flex items-center justify-between mb-6 relative">
      {/* LEFT */}
      <div>
        <h1 className="text-2xl font-bold text-[#0B1220]">
          Welcome back
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Here’s what’s happening with your account today.
        </p>

        {/* ⭐ RATING */}
        <div className="flex items-center gap-2 mt-3">
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star
                key={i}
                size={14}
                className={
                  rating >= i
                    ? "fill-[#e5e7eb] text-[#e5e7eb]"
                    : "text-gray-300"
                }
              />
            ))}
          </div>

          <span className="text-sm font-semibold text-[#0B1220]">
            {rating.toFixed(1)}
          </span>

          <span className="text-xs text-gray-500">
            ({reviewCount} reviews)
          </span>
        </div>
      </div>

      {/* RIGHT – NOTIFICATIONS + MESSAGES */}
      <div className="flex items-center gap-4">
        {/* 🔔 Notifications */}
        <div className="relative">
          <button onClick={openNotifications}>
            <Bell size={22} className="text-[#0B1220]" />
          </button>

          {notifCount > 0 && (
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
              {notifCount}
            </span>
          )}

          {showNotifs && (
            <div className="absolute right-0 mt-3 w-80 bg-white border border-gray-100 rounded-xl shadow-xl z-50">
              <div className="p-4 border-b text-sm font-semibold text-[#0B1220]">
                Notifications
              </div>

              {notifications.length === 0 ? (
                <div className="p-4 text-sm text-gray-500">
                  No notifications yet.
                </div>
              ) : (
                <div className="max-h-72 overflow-auto">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className="px-4 py-3 border-b last:border-b-0"
                    >
                      <p className="text-sm font-medium text-[#0B1220]">
                        {n.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {n.body}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-2">
                        {new Date(n.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 💬 Messages */}
        <div className="relative">
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
        </div>
      </div>
    </div>
  );
}