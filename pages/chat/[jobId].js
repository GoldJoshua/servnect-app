// 🔒 AUTH LOCKED – DO NOT MODIFY AUTH LOGIC
// Job-based chat page wrapper (Seeker ↔ Provider)
// REAL DB ONLY (access check stays)

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../../lib/supabaseClient";
import ChatWindow from "../../components/chat/ChatWindow";

export default function JobChatPage() {
  const router = useRouter();
  const { jobId } = router.query;

  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [names, setNames] = useState({
    seekerName: "User",
    providerName: "Provider",
  });

  useEffect(() => {
    if (!jobId) return;

    async function checkAccess() {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;

      if (!user) {
        router.replace("/login");
        return;
      }

      const { data: job, error } = await supabase
        .from("jobs")
        .select("seeker_id, provider_id")
        .eq("id", jobId)
        .single();

      if (error || !job) {
        router.replace("/404");
        return;
      }

      if (user.id !== job.seeker_id && user.id !== job.provider_id) {
        router.replace("/login");
        return;
      }

      // 🔐 FETCH SAFE DISPLAY NAMES
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name")
        .in("id", [job.seeker_id, job.provider_id]);

      const seeker =
        profiles?.find((p) => p.id === job.seeker_id)?.name;
      const provider =
        profiles?.find((p) => p.id === job.provider_id)?.name;

      setNames({
        seekerName:
          seeker && !String(seeker).includes("@")
            ? seeker.split(" ")[0]
            : "User",
        providerName:
          provider && !String(provider).includes("@")
            ? provider.split(" ")[0]
            : "Provider",
      });

      setAllowed(true);
      setLoading(false);
    }

    checkAccess();
  }, [jobId, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Loading chat…
      </div>
    );
  }

  if (!allowed) return null;

  return (
    <ChatWindow
      jobId={jobId}
      seekerName={names.seekerName}
      providerName={names.providerName}
    />
  );
}