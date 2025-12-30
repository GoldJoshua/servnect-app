// pages/auth/callback.js
// 🔒 AUTH CALLBACK – DO NOT ADD UI OR STYLING
// This page is the SINGLE landing point for ALL email links
// It decides where the user goes next.

import { useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from "../../lib/supabaseClient";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    async function handleAuth() {
      // 1️⃣ Ensure session exists (Supabase sets it automatically)
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        // Not authenticated → back to login
        router.replace("/login");
        return;
      }

      const userId = session.user.id;

      // 2️⃣ Fetch profile state
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("onboarding_complete, role")
        .eq("id", userId)
        .single();

      if (error || !profile) {
        // Profile missing or broken → force role selection
        router.replace("/signup-auth/choose-role");
        return;
      }

      // 3️⃣ Decide destination
      if (profile.onboarding_complete) {
        // ✅ Fully onboarded
        if (profile.role === "provider") {
          router.replace("/provider/dashboard");
        } else {
          router.replace("/seeker/dashboard");
        }
        return;
      }

      // 4️⃣ Not onboarded yet → send to onboarding gate
      router.replace("/onboarding-gate");
    }

    if (mounted) handleAuth();

    return () => {
      mounted = false;
    };
  }, [router]);

  // ⏳ No UI – silent processing page
  return null;
}