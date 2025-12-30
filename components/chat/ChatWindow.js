// 🔒 AUTH LOCKED – DO NOT MODIFY AUTH LOGIC
// Inbox-style chat window (3-panel UI)
// REAL DB + REALTIME + OPTIMISTIC UI + MARK AS READ
// + Phone-number blocking hook (/api/moderate-message)
// + Attachments (Supabase Storage)
// + Job Details panel
// + Unread badges in inbox
// + Typing indicator (presence)
// + Support takeover hook (UI-ready)
// + Job timeout display (expires_at)

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../../lib/supabaseClient";
import {
  Send,
  Phone,
  Info,
  MoreVertical,
  Paperclip,
  Search,
  ArrowLeft,
  BadgeAlert,
} from "lucide-react";
import CallWarningModal from "./CallWarningModal";

const ATTACHMENTS_BUCKET = "chat-attachments"; // ✅ create this bucket in Supabase Storage

// ✅ SAFE UUID (mobile Safari compatible)
function safeUUID() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID(); // ✅ return the real UUID
  }

  // Fallback for older browsers
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export default function ChatWindow({ jobId }) {
  const router = useRouter();

  // auth
  const [userId, setUserId] = useState(null);

  // inbox (left panel)
  const [threads, setThreads] = useState([]);
  const [threadQuery, setThreadQuery] = useState("");
  const [threadsLoading, setThreadsLoading] = useState(true);

  // active job + other user (center/right)
  const [job, setJob] = useState(null);
  const [otherUser, setOtherUser] = useState(null);

  // messages
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  // UI
  const [showCallWarning, setShowCallWarning] = useState(false);
  const [showJobDetails, setShowJobDetails] = useState(false);
  const [sending, setSending] = useState(false);

  // typing indicator (presence)
  const [otherTyping, setOtherTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

  // support hook (UI)
  const [supportRequested, setSupportRequested] = useState(false);
  const [supportJoined, setSupportJoined] = useState(false); // UI-ready

  const fileInputRef = useRef(null);
  const bottomRef = useRef(null);

  const isSeeker = useMemo(() => {
    if (!userId || !job) return false;
    return userId === job.seeker_id;
  }, [userId, job]);

  const isProvider = useMemo(() => {
    if (!userId || !job) return false;
    return userId === job.provider_id;
  }, [userId, job]);

  // ✅ DEFINE chatLocked EARLY (so all handlers always see the right value)
  const chatLocked = useMemo(() => {
    const s = String(job?.status || "").toLowerCase();
    // NOTE: provider_completed should still lock chat (provider has marked done)
    return ["provider_completed", "paid", "cancelled", "completed"].includes(s);
  }, [job?.status]);

  // -----------------------------
  // Helpers
  // -----------------------------
  async function getAuthedUser() {
    const { data: auth } = await supabase.auth.getUser();
    return auth?.user || null;
  }

  async function markRead(currentUserId) {
    if (!currentUserId || !jobId) return;

    await supabase
      .from("messages")
      .update({ is_read: true })
      .eq("job_id", jobId)
      .eq("receiver_id", currentUserId)
      .eq("is_read", false);
  }

  async function moderateOrBlock(messageText) {
    // 🚀 LAUNCH MODE
    // Moderation disabled temporarily
    // Off-platform enforcement comes later
    return { allowed: true };
  }

  function safeTime(ts) {
    try {
      return new Date(ts).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  }

  function isImage(mime) {
    return typeof mime === "string" && mime.startsWith("image/");
  }

  function isVideo(mime) {
    return typeof mime === "string" && mime.startsWith("video/");
  }

  function initialsFromName(name) {
    const n = (name || "U").trim();
    const parts = n.split(" ").filter(Boolean);
    const init = parts.map((p) => p[0]).join("").slice(0, 2).toUpperCase();
    return init || "U";
  }

  function formatCountdown(expiresAt) {
    if (!expiresAt) return null;
    const ms = new Date(expiresAt).getTime() - Date.now();
    if (Number.isNaN(ms)) return null;
    if (ms <= 0) return "Expired";
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}m ${s}s`;
  }

  // ✅ Fetch profiles in bulk once (id -> display name)
  async function fetchProfileMap(userIds) {
    const ids = Array.from(new Set((userIds || []).filter(Boolean)));
    if (ids.length === 0) return {};

    const { data, error } = await supabase
      .from("profiles")
      .select("id, name, full_name, email, is_support")
      .in("id", ids);

    if (error) {
      console.error("profiles fetch error:", error);
      return {};
    }

    const map = {};
    for (const p of data || []) {
      const display =
        (p?.name && String(p.name).trim()) ||
        (p?.full_name && String(p.full_name).trim()) ||
        (p?.email && String(p.email).trim()) ||
        "User";

      map[p.id] = {
        name: display,
        is_support: !!p.is_support,
      };
    }
    return map;
  }

  // ✅ Update left panel thread preview instantly (fixes “No messages yet”)
  function bumpThreadPreview({
    job_id,
    body,
    payload,
    created_at,
    sender_id,
    receiver_id,
  }) {
    const preview =
      payload?.type === "file" ? "📎 Attachment" : body ? body : "No messages yet";

    setThreads((prev) => {
      const next = (prev || []).map((t) => {
        if (t.job?.id !== job_id) return t;

        const isIncoming = receiver_id === userId; // unread for me
        const unread = isIncoming ? (t.unread || 0) + 1 : t.unread || 0;

        return {
          ...t,
          preview,
          lastAt: created_at || new Date().toISOString(),
          unread,
        };
      });

      // also re-sort so active chats bubble up
      next.sort(
        (a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime()
      );
      return next;
    });
  }

  // ✅ when opening this job, set its unread to 0 in left panel
  function clearThreadUnread(job_id) {
    setThreads((prev) =>
      (prev || []).map((t) =>
        t.job?.id === job_id ? { ...t, unread: 0 } : t
      )
    );
  }

  // -----------------------------
  // Load auth once
  // -----------------------------
  useEffect(() => {
    let alive = true;

    async function initAuth() {
      // ✅ ensure Realtime socket is authenticated immediately
      const { data } = await supabase.auth.getSession();
      if (!alive) return;

      const session = data?.session || null;
      const u = session?.user || null;
      if (!u) return;

      if (session?.access_token) {
        // This does NOT change auth logic; it ensures realtime receives events without requiring reload/logout.
        supabase.realtime.setAuth(session.access_token);
      }

      setUserId(u.id);
    }

    initAuth();
    return () => {
      alive = false;
    };
  }, []);

  // -----------------------------
  // LEFT PANEL: load threads (jobs list) + unread counts
  // -----------------------------
  useEffect(() => {
    if (!userId) return;

    let alive = true;

    async function loadThreads() {
      setThreadsLoading(true);

      const { data: jobsData, error } = await supabase
        .from("jobs")
        .select(
          "id, seeker_id, provider_id, service_title, status, address, scheduled_at, created_at, updated_at, budget, notes, accepted_at, expires_at"
        )
        .or(`seeker_id.eq.${userId},provider_id.eq.${userId}`)
        .order("updated_at", { ascending: false });

      if (!alive) return;

      if (error) {
        console.error("threads load error:", error);
        setThreads([]);
        setThreadsLoading(false);
        return;
      }

      const jobs = jobsData || [];

      const otherIds = jobs
        .map((j) => (userId === j.seeker_id ? j.provider_id : j.seeker_id))
        .filter(Boolean);

      const profileMap = await fetchProfileMap(otherIds);

      // unread counts in one query
      const { data: unreadData, error: unreadErr } = await supabase
        .from("messages")
        .select("job_id")
        .eq("receiver_id", userId)
        .eq("is_read", false);

      const unreadCountMap = {};
      if (!unreadErr) {
        for (const row of unreadData || []) {
          unreadCountMap[row.job_id] = (unreadCountMap[row.job_id] || 0) + 1;
        }
      } else {
        console.error("unread load error:", unreadErr);
      }

      const enriched = [];
      for (const j of jobs) {
        const otherId = userId === j.seeker_id ? j.provider_id : j.seeker_id;

        let otherName = "User";
        if (otherId) otherName = profileMap?.[otherId]?.name || "User";
        else otherName = "Unassigned Provider";

        const { data: lastMsg } = await supabase
          .from("messages")
          .select("body, created_at, payload, sender_id, receiver_id, job_id")
          .eq("job_id", j.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        const preview =
          lastMsg?.payload?.type === "file"
            ? "📎 Attachment"
            : lastMsg?.body
            ? lastMsg.body
            : "No messages yet";

        enriched.push({
          job: j,
          otherId,
          otherName,
          preview,
          lastAt: lastMsg?.created_at || j.updated_at || j.created_at,
          unread: unreadCountMap[j.id] || 0,
        });
      }

      enriched.sort(
        (a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime()
      );

      setThreads(enriched);
      setThreadsLoading(false);
    }

    loadThreads();
    return () => {
      alive = false;
    };
  }, [userId]);

  // -----------------------------
  // Active job: load job + other user + messages + realtime
  // + typing presence channel
  // -----------------------------
  useEffect(() => {
    if (!jobId || !userId) return;

    let msgChannel;
    let jobChannel;
    let typingChannel;
    let alive = true;

    async function loadActive() {
      const { data: j, error: jErr } = await supabase
        .from("jobs")
        .select(
          "id, seeker_id, provider_id, service_title, status, address, scheduled_at, created_at, updated_at, budget, notes, accepted_at, expires_at"
        )
        .eq("id", jobId)
        .single();

      if (!alive) return;

      if (jErr || !j) {
        console.error("job load error:", jErr);
        setJob(null);
        setOtherUser(null);
        setMessages([]);
        return;
      }

      setJob(j);

      const otherId = userId === j.seeker_id ? j.provider_id : j.seeker_id;

let otherName = "User";
let otherPhone = null;

if (otherId) {
  const map = await fetchProfileMap([otherId]);
  otherName = map?.[otherId]?.name || "User";
  otherPhone = map?.[otherId]?.phone || null;
  setSupportJoined(!!map?.[otherId]?.is_support);
} else {
  otherName = "Unassigned Provider";
}

setOtherUser({
  id: otherId,
  name: otherName,
  phone: otherPhone,
});
      const { data: history, error: mErr } = await supabase
        .from("messages")
        .select("*")
        .eq("job_id", jobId)
        .order("created_at", { ascending: true });

      if (!alive) return;

      if (!mErr) setMessages(history || []);

      // when opening chat: mark read + clear left unread badge
      await markRead(userId);
      clearThreadUnread(jobId);

      // ✅ REALTIME
      msgChannel = supabase
        .channel(`job-chat-${jobId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `job_id=eq.${jobId}`,
          },
          async (payload) => {
            setMessages((prev) => {
              // 🔁 Replace optimistic message if it exists (sender side)
              const index = prev.findIndex(
                (m) =>
                  m.__optimistic &&
                  m.client_id &&
                  m.client_id === payload.new.client_id
              );

              if (index !== -1) {
                const copy = [...prev];
                copy[index] = payload.new; // replace optimistic with real DB row
                return copy;
              }

              // 📩 Otherwise append (receiver side)
              return [...prev, payload.new];
            });

            // 🔔 Update left panel preview
            bumpThreadPreview(payload.new);

            // 👁️ Mark as read if message is for me
            if (payload.new.receiver_id === userId) {
              await markRead(userId);
              clearThreadUnread(jobId);
            }
          }
        )
        .subscribe();

      jobChannel = supabase
        .channel(`job-meta-${jobId}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "jobs",
            filter: `id=eq.${jobId}`,
          },
          (payload) => setJob(payload.new)
        )
        .subscribe();

      typingChannel = supabase.channel(`typing-${jobId}`, {
        config: { presence: { key: userId } },
      });

      typingChannel
        .on("presence", { event: "sync" }, () => {
          const state = typingChannel.presenceState();
          const others = Object.keys(state || {}).filter((k) => k !== userId);
          let isTyping = false;
          for (const k of others) {
            const metas = state[k] || [];
            for (const meta of metas) {
              if (meta?.typing) isTyping = true;
            }
          }
          setOtherTyping(isTyping);
        })
        .subscribe(async (status) => {
          if (status === "SUBSCRIBED") {
            await typingChannel.track({
              typing: false,
              at: new Date().toISOString(),
            });
          }
        });
    }

    loadActive();

    return () => {
      alive = false;
      if (msgChannel) supabase.removeChannel(msgChannel);
      if (jobChannel) supabase.removeChannel(jobChannel);
      if (typingChannel) supabase.removeChannel(typingChannel);
    };
  }, [jobId, userId]);

  // auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // filtered threads
  const filteredThreads = useMemo(() => {
    const q = threadQuery.trim().toLowerCase();
    if (!q) return threads;
    return threads.filter((t) => {
      const hay = `${t.otherName} ${t.job?.service_title || ""} ${
        t.preview || ""
      }`.toLowerCase();
      return hay.includes(q);
    });
  }, [threads, threadQuery]);

  // -----------------------------
  // Typing: broadcast using presence
  // -----------------------------
  async function broadcastTyping(isTyping) {
    try {
      const ch = supabase
        .getChannels()
        .find((c) => c.topic === `realtime:typing-${jobId}`);
      if (!ch) return;

      await ch.track({
        typing: isTyping,
        at: new Date().toISOString(),
      });
    } catch {
      // ignore
    }
  }

  function onChangeText(v) {
    setText(v);

    broadcastTyping(true);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      broadcastTyping(false);
    }, 900);
  }

  // -----------------------------
  // Send text message
  // -----------------------------
  async function sendTextMessage() {
    if (!text.trim() || !userId || !job) return;

    if (chatLocked) {
      alert(`Chat is closed because this job is ${job?.status || "closed"}.`);
      return;
    }

    const body = text.trim();

    const mod = await moderateOrBlock(body);
    if (!mod.allowed) {
      alert(mod.reason || "Message blocked by platform rules.");
      return;
    }

    if (!job.provider_id) {
      alert("Provider not yet connected. Please wait.");
      return;
    }

    const receiverId =
      userId === job.seeker_id ? job.provider_id : job.seeker_id;
    if (!receiverId) return;

    setText("");
    broadcastTyping(false);
    setSending(true);

    const optimisticId = safeUUID();
    const optimisticMessage = {
      id: optimisticId,
      client_id: optimisticId,
      job_id: jobId,
      sender_id: userId,
      receiver_id: receiverId,
      body,
      is_read: false,
      created_at: new Date().toISOString(),
      __optimistic: true,
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    // ✅ immediately update left panel preview (fixes “No messages yet”)
    bumpThreadPreview(optimisticMessage);

    const { error: insertError } = await supabase.from("messages").insert({
      job_id: jobId,
      sender_id: userId,
      receiver_id: receiverId,
      body,
      client_id: optimisticId,
      is_read: false,
    });

    if (insertError) {
      console.error("Message send failed:", insertError);
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      alert("Failed to send message.");
    }

    setSending(false);
  }

  // -----------------------------
  // Attachments
  // -----------------------------
  async function onPickFile(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !userId || !job) return;

    if (chatLocked) {
      alert(`Chat is closed because this job is ${job?.status || "closed"}.`);
      return;
    }

    if (!job.provider_id) {
      alert("Provider not yet connected. Please wait.");
      return;
    }

    const receiverId =
      userId === job.seeker_id ? job.provider_id : job.seeker_id;
    if (!receiverId) return;

    try {
      setSending(true);

      const ext = (file.name.split(".").pop() || "").toLowerCase();
      const path = `${jobId}/${userId}/${safeUUID()}.${ext || "bin"}`;

      const { error: upErr } = await supabase.storage
        .from(ATTACHMENTS_BUCKET)
        .upload(path, file, { upsert: false, contentType: file.type });

      if (upErr) {
        console.error("upload error:", upErr);
        alert(
          `Attachment upload failed.\n\nBucket: "${ATTACHMENTS_BUCKET}"\nReason: ${
            upErr.message || "Unknown"
          }`
        );
        setSending(false);
        return;
      }

      let url = null;
      const pub = supabase.storage.from(ATTACHMENTS_BUCKET).getPublicUrl(path);
      url = pub?.data?.publicUrl || pub?.publicUrl || null;

      const payload = {
        type: "file",
        url,
        path,
        name: file.name,
        mime: file.type,
        size: file.size,
      };

      // ✅ include client_id so realtime can replace optimistic attachment
      const optimisticId = safeUUID();
      const optimisticMessage = {
        id: optimisticId,
        client_id: optimisticId,
        job_id: jobId,
        sender_id: userId,
        receiver_id: receiverId,
        body: "",
        payload,
        is_read: false,
        created_at: new Date().toISOString(),
        __optimistic: true,
      };

      setMessages((prev) => [...prev, optimisticMessage]);
      bumpThreadPreview(optimisticMessage);

      const { error: insertError } = await supabase.from("messages").insert({
        job_id: jobId,
        sender_id: userId,
        receiver_id: receiverId,
        body: "",
        payload,
        client_id: optimisticId,
        is_read: false,
      });

      if (insertError) {
        console.error("attachment message insert failed:", insertError);
        setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
        alert("Failed to send attachment.");
      }

      setSending(false);
    } catch (err) {
      console.error(err);
      setSending(false);
      alert("Attachment failed.");
    }
  }

  // -----------------------------
  // Job actions (right panel)
  // -----------------------------
  async function markJobCompleted() {
    if (!job?.id) return;

    // ✅ Provider can mark as provider_completed (optional step)
    if (isProvider) {
      const ok = confirm("Mark this job as completed on your side?");
      if (!ok) return;

      const { error } = await supabase
        .from("jobs")
        .update({
          status: "provider_completed",
          provider_completed_at: new Date().toISOString(),
        })
        .eq("id", job.id);

      if (error) {
        console.error(error);
        alert(error.message || "Failed to mark provider_completed.");
      }
      return;
    }

    // ✅ Seeker MUST be able to complete without waiting (so they can rate/review)
    if (isSeeker) {
      const ok = confirm("Confirm job completion?");
      if (!ok) return;

      const { error } = await supabase
        .from("jobs")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", job.id);

      if (error) {
        console.error(error);
        alert(error.message || "Failed to mark job as completed.");
        return;
      }

      router.push(`/seeker/rate/${job.id}`);
    }
  }

  async function cancelJob() {
    if (!job?.id) return;

    if (chatLocked) return;

    const ok = confirm(
      "Cancel this job? This will close the chat and end the job."
    );
    if (!ok) return;

    const { error } = await supabase
      .from("jobs")
      .update({ status: "cancelled" })
      .eq("id", job.id);

    if (error) {
      console.error(error);
      alert(error.message || "Failed to cancel job.");
    } else {
      router.push(isSeeker ? "/seeker/dashboard" : "/provider/dashboard");
    }
  }

  function reportIssue() {
    setSupportRequested(true);
    alert("Support has been notified (UI hook). Next: Support takeover view.");
  }

  // -----------------------------
  // Render
  // -----------------------------
  const activeThread = threads.find((t) => t.job?.id === jobId);
  const headerName = otherUser?.name || activeThread?.otherName || "Chat";
  const countdown = useMemo(
    () => formatCountdown(job?.expires_at),
    [job?.expires_at]
  );

  return (
    <div className="min-h-screen bg-[#eef1f6] flex">
      {/* LEFT: THREADS */}
      <aside className="hidden lg:flex w-[320px] bg-white border-r border-gray-200 flex-col">
        <div className="px-5 py-4 border-b">
          <div className="text-lg font-semibold text-[#0b1220]">Messages</div>
          <div className="mt-3 flex items-center gap-2 bg-[#f5f7fb] border border-gray-200 rounded-xl px-3 py-2">
            <Search size={16} className="text-gray-400" />
            <input
              value={threadQuery}
              onChange={(e) => setThreadQuery(e.target.value)}
              placeholder="Search messages..."
              className="w-full bg-transparent outline-none text-sm"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {threadsLoading ? (
            <div className="p-5 text-sm text-gray-500">
              Loading conversations…
            </div>
          ) : filteredThreads.length === 0 ? (
            <div className="p-5 text-sm text-gray-500">
              No conversations yet.
            </div>
          ) : (
            filteredThreads.map((t) => {
              const selected = t.job?.id === jobId;
              const initials = initialsFromName(t.otherName);

              return (
                <button
                  key={t.job.id}
                  onClick={() => router.push(`/chat/${t.job.id}`)}
                  className={`w-full text-left px-4 py-4 flex gap-3 border-b hover:bg-[#f7f9fc] transition ${
                    selected ? "bg-[#eef1f6]" : "bg-white"
                  }`}
                >
                  <div className="relative">
                    <div className="h-10 w-10 rounded-full bg-[#0b1220] text-white flex items-center justify-center text-xs font-bold">
                      {initials}
                    </div>

                    {t.unread > 0 && (
                      <div className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] flex items-center justify-center">
                        {t.unread > 99 ? "99+" : t.unread}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-semibold text-sm text-[#0b1220] truncate">
                        {t.otherName}
                      </div>
                      <div className="text-[11px] text-gray-400 whitespace-nowrap">
                        {t.lastAt ? safeTime(t.lastAt) : ""}
                      </div>
                    </div>

                    <div className="text-[12px] text-gray-500 truncate">
                      {t.job?.service_title || "Service"} • {t.preview}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* CENTER: CHAT */}
      <section className="flex-1 flex flex-col min-w-0">
        {/* TOP BAR */}
        <div className="bg-white border-b px-4 lg:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
              onClick={() => router.back()}
              aria-label="Back"
            >
              <ArrowLeft size={18} />
            </button>

            <div className="h-10 w-10 rounded-full bg-[#0b1220] text-white flex items-center justify-center text-xs font-bold">
              {initialsFromName(headerName)}
            </div>

            <div className="min-w-0">
              <div className="font-semibold text-[#0b1220] truncate">
                {headerName}
              </div>

              <div className="text-[12px] text-gray-400 truncate">
                {job?.service_title || "Job Chat"} • {job?.status || "—"}
                {otherTyping ? " • typing…" : ""}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCallWarning(true)}
              className="p-2 rounded-lg hover:bg-gray-100"
              aria-label="Call"
              title="Call"
              disabled={chatLocked}
            >
              <Phone size={18} />
            </button>

            <button
              onClick={() => setShowJobDetails(true)}
              className="p-2 rounded-lg hover:bg-gray-100 lg:hidden"
              aria-label="Info"
              title="Info"
            >
              <Info size={18} />
            </button>

            <button
              onClick={() => alert("More options coming soon")}
              className="p-2 rounded-lg hover:bg-gray-100"
              aria-label="More"
              title="More"
            >
              <MoreVertical size={18} />
            </button>
          </div>
        </div>

        {/* MESSAGES */}
        <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-6 space-y-3">
          {messages.map((msg) => {
            const mine = msg.sender_id === userId;
            const payload = msg.payload;
            const hasFile = payload?.type === "file" && payload?.path;

            return (
              <div
                key={msg.id}
                className={`max-w-[520px] ${mine ? "ml-auto" : "mr-auto"}`}
              >
                <div
                  className={`px-4 py-3 rounded-2xl text-sm shadow-sm border ${
                    mine
                      ? "bg-[#0b1220] text-white border-[#0b1220]"
                      : "bg-white text-gray-800 border-gray-200"
                  }`}
                >
                  {hasFile ? (
                    <div className="space-y-2">
                      {payload.url && isImage(payload.mime) ? (
                        <img
                          src={payload.url}
                          alt={payload.name || "Attachment"}
                          className="max-h-64 rounded-xl border"
                        />
                      ) : payload.url && isVideo(payload.mime) ? (
                        <video
                          src={payload.url}
                          controls
                          className="max-h-64 w-full rounded-xl border"
                        />
                      ) : (
                        <div className="space-y-1">
                          <div className="text-[12px] opacity-80">
                            📎 {payload.name || "Attachment"}
                          </div>
                          {payload.url ? (
                            <a
                              href={payload.url}
                              target="_blank"
                              rel="noreferrer"
                              className={`underline text-sm ${
                                mine ? "text-white" : "text-[#0b1220]"
                              }`}
                            >
                              Open / Download
                            </a>
                          ) : (
                            <div className="text-[12px] opacity-70">
                              (Private file – URL will be resolved later)
                            </div>
                          )}
                        </div>
                      )}

                      {msg.body ? <div className="text-sm">{msg.body}</div> : null}
                    </div>
                  ) : (
                    <div>{msg.body}</div>
                  )}

                  <div className="text-[10px] opacity-70 mt-2">
                    {safeTime(msg.created_at)}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* INPUT BAR */}
        <div className="border-t bg-white px-3 lg:px-4 py-4">
          {chatLocked && (
            <div className="mb-3 px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-[12px] text-gray-600">
              🔒 Chat is closed because this job is <b>{job?.status}</b>.
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={onPickFile}
              accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={sending || chatLocked}
              className="p-3 rounded-xl hover:bg-gray-100"
              aria-label="Attach"
              title="Attach"
            >
              <Paperclip size={18} />
            </button>

            <input
              value={text}
              disabled={sending || chatLocked}
              onChange={(e) => onChangeText(e.target.value)}
              placeholder="Type your message…"
              className="flex-1 rounded-2xl border border-gray-200 bg-[#f7f9fc] px-4 py-3 text-sm outline-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !chatLocked) sendTextMessage();
              }}
            />

            <button
              onClick={sendTextMessage}
              disabled={sending || chatLocked}
              className="p-3 rounded-xl bg-[#0b1220] text-white shadow disabled:opacity-60"
              aria-label="Send"
              title="Send"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* RIGHT: JOB DETAILS */}
      <aside className="hidden xl:flex w-[340px] bg-white border-l border-gray-200 flex-col">
        <div className="px-6 py-5 border-b">
          <div className="text-[11px] tracking-widest text-gray-400 font-semibold">
            JOB DETAILS
          </div>
        </div>

        <div className="px-6 py-5 space-y-4 overflow-y-auto">
          <div className="bg-[#f7f9fc] border border-gray-200 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-[#0b1220]">Status</div>
              <span className="text-[11px] px-2 py-1 rounded-full bg-white border text-gray-600">
                {job?.status || "—"}
              </span>
            </div>

            {!!countdown && job?.status === "pending" && (
              <div className="mt-3 text-xs text-gray-500">
                Timeout: <span className="font-semibold">{countdown}</span>
              </div>
            )}

            <div className="mt-4 space-y-2 text-[12px] text-gray-600">
              <div>
                <div className="text-gray-400 text-[11px]">Service</div>
                <div className="font-medium text-gray-700">
                  {job?.service_title || job?.service || "—"}
                </div>
              </div>

              <div>
                <div className="text-gray-400 text-[11px]">Scheduled</div>
                <div className="font-medium text-gray-700">
                  {job?.scheduled_at
                    ? new Date(job.scheduled_at).toLocaleString()
                    : "—"}
                </div>
              </div>

              <div>
                <div className="text-gray-400 text-[11px]">Service Location</div>
                <div className="font-medium text-gray-700">
                  {job?.address || "—"}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <div className="text-sm font-semibold text-[#0b1220] mb-2">
              Service Ordered
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="text-gray-600">{job?.service_title || "—"}</div>
              <div className="font-semibold text-[#0b1220]">
                {job?.budget != null
                  ? `₦${Number(job.budget).toLocaleString()}`
                  : "—"}
              </div>
            </div>

            <div className="mt-4">
              <div className="text-[11px] text-gray-400 mb-1">Note</div>
              <div className="text-[12px] text-gray-600 whitespace-pre-wrap">
                {job?.notes || "—"}
              </div>
            </div>
          </div>

          {/* ✅ SIMPLE PAYMENT NOTE (ESCROW REMOVED) */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <div className="text-sm font-semibold text-[#0b1220]">Payment</div>

            {isProvider && (
              <div className="mt-3 text-[12px] text-red-600 leading-relaxed">
                ❌ Do not request off-platform payment inside this chat.
                <br />
                🚨 Violations can lead to suspension and loss of access to customers.
              </div>
            )}

            {isSeeker && (
              <div className="mt-3 text-[12px] text-gray-600 leading-relaxed">
                ℹ️ Escrow and on-platform payments are coming soon.
                <br />
                For now, payment is handled directly between you and the provider.
              </div>
            )}
          </div>

          <div className="space-y-2">
            <button
              onClick={reportIssue}
              className="w-full py-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-sm flex items-center justify-center gap-2"
            >
              <BadgeAlert size={16} />
              {supportRequested ? "Support requested" : "Report Issue / Get Support"}
            </button>

            {!chatLocked && (
              <button
                onClick={cancelJob}
                className="w-full py-3 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-sm text-red-700 font-semibold"
              >
                Cancel Job
              </button>
            )}

            <button
              onClick={markJobCompleted}
              disabled={chatLocked}
              className={`w-full py-3 rounded-xl border border-gray-200 text-sm ${
                chatLocked
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-white hover:bg-gray-50"
              }`}
              title={chatLocked ? "Chat is closed" : "Mark as Completed"}
            >
              Mark as Completed
            </button>

            {supportJoined && (
              <div className="text-xs text-gray-500 text-center">
                Support is in this chat.
              </div>
            )}
          </div>
        </div>
      </aside>

      
      {/* MOBILE JOB DETAILS DRAWER */}
      {showJobDetails && (
        <div className="fixed inset-0 z-50 bg-black/40 lg:hidden">
          <div className="absolute right-0 top-0 h-full w-[90%] max-w-sm bg-white shadow-xl overflow-y-auto">
            <div className="px-4 py-4 border-b flex items-center justify-between">
              <div className="font-semibold text-[#0b1220]">Job Details</div>
              <button
                onClick={() => setShowJobDetails(false)}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="bg-[#f7f9fc] border border-gray-200 rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-[#0b1220]">Status</div>
                  <span className="text-[11px] px-2 py-1 rounded-full bg-white border text-gray-600">
                    {job?.status || "—"}
                  </span>
                </div>

                {!!countdown && job?.status === "pending" && (
                  <div className="mt-3 text-xs text-gray-500">
                    Timeout: <span className="font-semibold">{countdown}</span>
                  </div>
                )}
              </div>

              <div className="border border-gray-200 rounded-2xl p-4">
                <div className="text-sm font-semibold text-[#0b1220] mb-2">Service</div>
                <div className="text-sm text-gray-600">{job?.service_title || "—"}</div>
                <div className="mt-2 text-xs text-gray-500">
                  {job?.scheduled_at
                    ? new Date(job.scheduled_at).toLocaleString()
                    : "—"}
                </div>
                <div className="mt-2 text-xs text-gray-500">{job?.address || "—"}</div>
              </div>

              <div className="border border-gray-200 rounded-2xl p-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="text-gray-600">Budget</div>
                  <div className="font-semibold text-[#0b1220]">
                    {job?.budget != null
                      ? `₦${Number(job.budget).toLocaleString()}`
                      : "—"}
                  </div>
                </div>
              </div>

              <button
                onClick={markJobCompleted}
                disabled={chatLocked}
                className="w-full py-3 rounded-xl border border-gray-200 text-sm bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
              >
                Mark as Completed
              </button>

              {!chatLocked && (
                <button
                  onClick={cancelJob}
                  className="w-full py-3 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-sm text-red-700 font-semibold"
                >
                  Cancel Job
                </button>
              )}
            </div>
          </div>
        </div>
      )}


      {/* CALL WARNING MODAL */}
<CallWarningModal
  open={showCallWarning}
  onClose={() => setShowCallWarning(false)}
  onProceed={() => {
    setShowCallWarning(false);

    if (!otherUser?.phone) {
      alert("Provider phone number not available.");
      return;
    }

    const phone = String(otherUser.phone).replace(/[^\d+]/g, "");
    window.location.href = `tel:${phone}`;
  }}
/>
    </div>
  );
}