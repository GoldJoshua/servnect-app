// 🔒 AUTH SAFE
// pages/forgot-password.js
// UI matches login/password page

import { useState } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { supabase } from "../lib/supabaseClient";

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleReset(e) {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setMsg("");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password?type=recovery`,
    });

    if (error) {
      setMsg(error.message);
    } else {
      setMsg("Password reset email sent. Check your inbox.");
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
            <p className="mt-3 text-gray-600">
              Reset your password securely.
            </p>
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
            <div className="text-sm text-gray-500">Password Reset</div>
          </div>

          <div className="bg-[#f8fbff] rounded-2xl p-10 shadow border border-white/60">
            <h1 className="text-3xl font-bold text-[#07102a]">
              Forgot your password?
            </h1>

            <p className="mt-2 text-gray-500 text-sm">
              Enter your email and we’ll send you a reset link.
            </p>

            <form onSubmit={handleReset} className="mt-6">
              <label className="text-xs text-gray-500 mb-2 block">
                Email address
              </label>

              <div className="rounded-xl bg-white p-4 border border-gray-100 shadow-sm">
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent outline-none text-base"
                />
              </div>

              {msg && (
                <p
                  className={`mt-4 text-sm ${
                    msg.includes("sent")
                      ? "text-green-600"
                      : "text-red-500"
                  }`}
                >
                  {msg}
                </p>
              )}

              <div className="mt-8 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className={`px-6 py-3 rounded-xl text-white font-medium ${
                    loading
                      ? "bg-gray-300 cursor-not-allowed"
                      : "bg-gradient-to-r from-[#0b1220] to-[#3b485f]"
                  }`}
                >
                  {loading ? "Sending…" : "Send reset link →"}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}