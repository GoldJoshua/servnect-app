// 🔒 AUTH LOCKED – DO NOT MODIFY
// Global Admin Guard (FINAL)

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../../lib/supabaseClient";

export default function RequireAdmin({ children }) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function enforceAdmin() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const user = session?.user;

      // Not logged in
      if (!user) {
        router.replace("/login");
        return;
      }

      // Check profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, is_banned")
        .eq("id", user.id)
        .single();

      // ❗ FIXED: handle NULL is_banned properly
      const isBanned = profile?.is_banned === true;

      // Not admin OR banned
      if (!profile || profile.role !== "admin" || isBanned) {
        router.replace("/login");
        return;
      }

      if (mounted) setAllowed(true);
    }

    enforceAdmin();

    return () => {
      mounted = false;
    };
  }, [router]);

  if (!allowed) return null;
  return children;
}