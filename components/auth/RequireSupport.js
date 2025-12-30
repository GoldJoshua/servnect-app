// components/auth/RequireSupport.js
// 🔒 AUTH LOCKED – SAFE VERSION
// Guards Support pages using profiles.role = 'support'

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../../lib/supabaseClient";

export default function RequireSupport({ children }) {
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let active = true;

    async function checkSupportAccess() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const user = session?.user;

      if (!user) {
        if (active) router.replace("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role === "support") {
        if (active) setAllowed(true);
      } else {
        if (active) router.replace("/login");
      }

      if (active) setChecking(false);
    }

    checkSupportAccess();

    return () => {
      active = false;
    };
  }, [router]);

  if (checking) return null;
  if (!allowed) return null;

  return children;
}