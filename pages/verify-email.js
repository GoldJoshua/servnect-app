// 🔒 AUTH LOCKED – DO NOT MODIFY
// This page FINALIZES signup after email verification.
// It redirects users into onboarding (NOT dashboard).

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../lib/supabaseClient";
import MotionDiv from "../components/MotionDiv";
import Button from "../components/Button";
import { Mail, RefreshCw } from "lucide-react";

export default function VerifyEmail() {
  const router = useRouter();
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState("Waiting for email verification…");

  const email =
    typeof window !== "undefined"
      ? localStorage.getItem("auth_signup_email") || ""
      : "";

  // 🔐 FINALIZE SIGNUP AFTER EMAIL VERIFICATION
  useEffect(() => {
    async function finalize() {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;

      // Not logged in yet
      if (!user) return;

      // Email not verified yet
      if (!user.email_confirmed_at) return;

      setStatus("Email verified. Preparing onboarding…");

      // Fetch role ONLY
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (!profile?.role) {
        setStatus("Profile error. Redirecting…");
        setTimeout(() => router.replace("/login"), 2000);
        return;
      }

      // Clean temp data
      localStorage.removeItem("auth_signup_email");

      // 🚀 SEND TO ONBOARDING (NOT DASHBOARD)
      if (profile.role === "provider") {
        router.replace("/onboarding/provider/step1-full-name");
      } else {
        router.replace("/onboarding/seeker/step1-full-name");
      }
    }

    finalize();
  }, [router]);

  async function resendEmail() {
    if (!email) {
      alert("Email not found. Please sign up again.");
      return;
    }

    setSending(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
    });
    setSending(false);

    if (error) alert("Failed to resend email: " + error.message);
    else alert("Verification email resent!");
  }

  function openEmailApp() {
    window.location.href = "mailto:";
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <MotionDiv className="w-full max-w-xl bg-white rounded-2xl p-12 text-center">
        <Mail size={56} className="mx-auto text-[#0b1220]" />

        <h2 className="mt-6 text-2xl font-bold">Verify your email</h2>

        <p className="mt-3 text-gray-600">{status}</p>

        {email && (
          <p className="font-medium mt-2 text-sm text-gray-800">{email}</p>
        )}

        <div className="mt-8 space-y-3">
          <Button
            onClick={openEmailApp}
            className="bg-gradient-to-r from-[#0b1220] to-[#3b485f] text-white w-full"
          >
            Open email app
          </Button>

          <Button onClick={resendEmail} disabled={sending} className="w-full">
            {sending ? (
              <span className="flex items-center justify-center gap-2">
                <RefreshCw size={16} className="animate-spin" />
                Resending…
              </span>
            ) : (
              "Resend verification email"
            )}
          </Button>
        </div>

        <p className="mt-6 text-sm text-gray-500">
          Already verified?{" "}
          <a href="/login" className="text-[#0b1220] font-medium">
            Login
          </a>
        </p>
      </MotionDiv>
    </div>
  );
}