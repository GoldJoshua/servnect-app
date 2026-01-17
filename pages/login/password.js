// 🔒 AUTH LOCKED – DO NOT MODIFY
// pages/login/password.js

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

const ADMIN_EMAIL = "joshua@aurevate.com";

export default function LoginPassword() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("login_email");
    if (saved) setEmail(saved);
    else setErr("Please enter your email again.");

    // 🔍 DEBUG — LOG SUPABASE PROJECT (TEMP)
    console.log("🔍 SUPABASE URL:", supabase?.supabaseUrl);
    console.log(
      "🔍 SUPABASE KEY PREFIX:",
      supabase?.supabaseKey?.slice(0, 20)
    );
  }, []);

  async function login(e) {
    e.preventDefault();
    if (!password || !email) return;

    setLoading(true);
    setErr("");

    // 1️⃣ SIGN IN
    const { data: authData, error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (error) {
      console.error("❌ LOGIN ERROR:", error);
      setErr("Incorrect password. Try again.");
      setLoading(false);
      return;
    }

    const user = authData.user;

    // 2️⃣ FETCH PROFILE (IF EXISTS)
    let { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("id, role, support_role")
      .eq("id", user.id)
      .single();

    let resolvedRole = null;

    // 3️⃣ RESOLVE ROLE — PROFILES FIRST
    if (profile?.role) {
      resolvedRole = profile.role;
    }

    // 4️⃣ SUPPORT FLAG
    if (!resolvedRole && profile?.support_role === true) {
      resolvedRole = "support";
    }

    // 5️⃣ AUTH METADATA (NEW SIGNUPS ONLY)
    if (!resolvedRole && user.user_metadata?.role) {
      resolvedRole = user.user_metadata.role;

      if (profileErr && profileErr.code === "PGRST116") {
        await supabase.from("profiles").insert({
          id: user.id,
          role: resolvedRole,
        });
      }

      if (profile && !profile.role) {
        await supabase
          .from("profiles")
          .update({ role: resolvedRole })
          .eq("id", user.id);
      }
    }

    // 6️⃣ ADMIN EMAIL FALLBACK
    if (!resolvedRole && user.email === ADMIN_EMAIL) {
      resolvedRole = "admin";

      await supabase.from("profiles").upsert({
        id: user.id,
        role: "admin",
      });
    }

    // 7️⃣ FINAL FAIL SAFE
    if (!resolvedRole) {
      setErr("Account role not configured. Contact support.");
      setLoading(false);
      return;
    }

    // 8️⃣ REDIRECT
    if (resolvedRole === "admin") {
      router.replace("/admin");
    } else if (resolvedRole === "support") {
      router.replace("/support");
    } else if (resolvedRole === "provider") {
      router.replace("/provider/dashboard");
    } else if (resolvedRole === "seeker") {
      router.replace("/seeker/dashboard");
    } else {
      setErr("Account role not configured.");
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen flex bg-[#eef1f6]">
      {/* LEFT PANEL */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-[#f8fafc] to-[#edf2f7] p-12 items-center justify-center relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-5"
          style={{
            background:
              "repeating-linear-gradient(-25deg, rgba(0,0,0,0.02) 0 2px, transparent 2px 40px)",
          }}
        />
        <div className="relative z-10 max-w-xs">
          <div className="rounded-2xl p-8 bg-white/60 backdrop-blur-sm shadow-2xl border border-white/30">
            <h2 className="text-4xl font-extrabold tracking-tight text-[#0b1220]">
              ServiceConnect
            </h2>
            <p className="mt-3 text-gray-600">Secure login continues...</p>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="w-full max-w-lg"
        >
          <div className="flex items-center justify-between mb-6 px-2">
            <button
              onClick={() => router.push("/login")}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 p-2 rounded-lg bg-white shadow-sm border border-white/60"
            >
              <ArrowLeft size={18} />
              <span className="text-sm">Back</span>
            </button>
            <div className="text-sm text-gray-500">Login</div>
          </div>

          <div className="bg-[#f8fbff] rounded-2xl p-10 shadow border border-white/60">
            <h1 className="text-3xl font-bold text-[#07102a]">
              Enter Password
            </h1>
            <p className="mt-2 text-gray-500">
              Email: <strong>{email || "—"}</strong>
            </p>

            <div className="mt-6">
              <label className="text-xs text-gray-500 mb-2 block">
                Password
              </label>
              <div className="rounded-xl bg-white p-4 border border-gray-100 shadow-sm">
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent outline-none text-base"
                />
              </div>
            </div>

            {err && <p className="text-red-500 text-sm mt-3">{err}</p>}

            <div className="mt-8 flex items-center justify-between">
              <button
                onClick={() => router.push("/forgot-password")}
                className="px-5 py-3 rounded-lg text-sm text-gray-600 hover:text-gray-800"
              >
                Forgot password?
              </button>

              <button
                onClick={login}
                disabled={!password || loading}
                className={`px-6 py-3 rounded-xl text-white font-medium ${
                  !password || loading
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-gradient-to-r from-[#0b1220] to-[#3b485f]"
                }`}
              >
                {loading ? "Logging in..." : "Login →"}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}