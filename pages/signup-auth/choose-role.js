// 🔒 AUTH LOCKED – DO NOT MODIFY
// Absolute gatekeeper for role selection
// 🛑 MUST NOT run during password recovery

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/router";
import { ArrowLeft, Users, Briefcase } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

const ADMIN_EMAIL = "joshua@aurevate.com";

export default function ChooseRole() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    function isRecoverySession() {
      if (typeof window === "undefined") return false;
      return window.location.hash.includes("type=recovery");
    }

    async function gatekeeper() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      // 🔐 RECOVERY SESSION → FORCE RESET PAGE
      if (isRecoverySession()) {
        router.replace("/reset-password");
        return;
      }

      const user = session?.user;

      if (!user) {
        setChecking(false);
        return;
      }

      // 🛡 Admin bypass
      if (user.email === ADMIN_EMAIL) {
        router.replace("/admin");
        return;
      }

      setChecking(false);
    }

    gatekeeper();
  }, [router]);

  if (checking) return null;

  function goHome() {
    window.location.href = "https://servnect.com";
  }

  function chooseSeeker() {
    router.push("/signup-auth/seeker/step1-email");
  }

  function chooseProvider() {
    router.push("/signup-auth/provider/step1-email");
  }

  return (
    <div className="min-h-screen flex bg-[#eef1f6]">
      {/* LEFT */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-[#f8fafc] to-[#edf2f7] p-12 items-center justify-center relative">
        <div
          className="absolute inset-0 opacity-5"
          style={{
            background:
              "repeating-linear-gradient(-25deg, rgba(0,0,0,0.025) 0 2px, transparent 2px 40px)",
          }}
        />

        <div className="relative z-10 max-w-xs">
          <div className="rounded-2xl p-8 bg-white/60 backdrop-blur shadow-2xl border">
            <h2 className="text-4xl font-extrabold text-[#0b1220]">
              ServiceConnect
            </h2>
            <p className="mt-3 text-gray-600">
              Before we begin, tell us who you are.
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-xl"
        >
          <div className="flex justify-between mb-8">
            <button
              onClick={goHome}
              className="flex items-center gap-2 text-sm bg-white px-3 py-2 rounded-lg border"
            >
              <ArrowLeft size={16} /> Back
            </button>
            <span className="text-sm text-gray-400">Choose role</span>
          </div>

          <div className="grid gap-6">
            <div
              onClick={chooseSeeker}
              className="cursor-pointer bg-white p-10 rounded-2xl shadow hover:shadow-lg transition"
            >
              <Users size={40} />
              <h3 className="text-xl font-bold mt-4">Service Seeker</h3>
              <p className="text-gray-500 text-sm mt-2">
                Book trusted professionals
              </p>
            </div>

            <div
              onClick={chooseProvider}
              className="cursor-pointer bg-white p-10 rounded-2xl shadow hover:shadow-lg transition"
            >
              <Briefcase size={40} />
              <h3 className="text-xl font-bold mt-4">Service Provider</h3>
              <p className="text-gray-500 text-sm mt-2">
                Offer services & get clients
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}