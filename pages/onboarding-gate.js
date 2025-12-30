// pages/onboarding-gate.js
// 🔒 ONBOARDING GATE – ROUTING ONLY
// This file decides where onboarding starts.
// DO NOT add UI here.

import { useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";

export default function OnboardingGate() {
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    async function routeUser() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      // Not authenticated
      if (!session?.user) {
        router.replace("/login");
        return;
      }

      // Fetch profile
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();

      if (error || !profile?.role) {
        router.replace("/signup-auth/choose-role");
        return;
      }

      // ✅ ROUTE TO REAL ONBOARDING ENTRY POINTS
      if (profile.role === "provider") {
        router.replace("/onboarding/provider/step1-full-name");
        return;
      }

      // seeker
      router.replace("/onboarding/seeker/step1-full-name");
    }

    if (mounted) routeUser();
    return () => {
      mounted = false;
    };
  }, [router]);

  // No UI – this page only redirects
  return null;
}