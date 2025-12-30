// components/auth/RequireRole.js
// 🔒 AUTH LOCKED – SAFE VERSION
// Enforces role-based access AND onboarding completion
// 🛑 Recovery sessions MUST bypass this guard

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../../lib/supabaseClient";

export default function RequireRole({ role, children }) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let mounted = true;
    let attempts = 0;
    const MAX_ATTEMPTS = 5;

    function isRecoverySession() {
      if (typeof window === "undefined") return false;
      return window.location.hash.includes("type=recovery");
    }

    async function checkRoleWithRetry() {
      // 🟢 Password recovery bypass
      if (isRecoverySession()) {
        if (mounted) setAllowed(true);
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      const user = session?.user;

      // 🚫 Not logged in
      if (!user) {
        router.replace("/login");
        return;
      }

      // 🔁 Retry loop (handles race conditions)
      while (attempts < MAX_ATTEMPTS) {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("role, onboarding_complete")
          .eq("id", user.id)
          .single();

        if (profile?.role) {
          if (!mounted) return;

          // 🚪 ONBOARDING GATE (CRITICAL)
          if (!profile.onboarding_complete) {
            if (profile.role === "provider") {
              router.replace("/onboarding/provider/step1-full-name");
              return;
            }

            if (profile.role === "seeker") {
              router.replace("/onboarding/seeker/step1-full-name");
              return;
            }
          }

          // ✅ Correct role
          if (profile.role === role) {
            setAllowed(true);
            return;
          }

          // 🔀 Redirect by role
          if (profile.role === "provider") {
            router.replace("/provider/dashboard");
            return;
          }

          if (profile.role === "seeker") {
            router.replace("/seeker/dashboard");
            return;
          }

          if (profile.role === "support") {
            router.replace("/support/tickets");
            return;
          }

          if (profile.role === "admin") {
            router.replace("/admin");
            return;
          }

          router.replace("/login");
          return;
        }

        // ⏳ wait & retry
        attempts++;
        await new Promise((res) => setTimeout(res, 300));
      }

      router.replace("/login");
    }

    checkRoleWithRetry();

    return () => {
      mounted = false;
    };
  }, [router, role]);

  if (!allowed) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Checking access…
      </div>
    );
  }

  return children;
}