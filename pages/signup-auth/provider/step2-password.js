// pages/signup-auth/provider/step2-password.js
import { useState } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { supabase } from "../../../lib/supabaseClient";

export default function ProviderSignupPassword() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);

  function goBack() {
    router.push("/signup-auth/provider/step1-email");
  }

  async function submit() {
    if (password.length < 6) return;
    if (typeof window === "undefined") return;

    const email = localStorage.getItem("auth_signup_email");
    if (!email) {
      alert("Signup session expired. Please start again.");
      router.replace("/signup-auth/choose-role");
      return;
    }

    setLoading(true);

    // 🔐 AUTH SIGNUP — DO NOT MODIFY
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          role: "provider",
        },
      },
    });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    localStorage.removeItem("auth_signup_email");
    setLoading(false);
    router.replace("/verify-email");
  }

  return (
    <div className="min-h-screen flex bg-[#eef1f6]">
      {/* LEFT BRAND PANEL */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-[#f8fafc] to-[#edf2f7] p-12 items-center justify-center relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 opacity-5"
          style={{
            background:
              "repeating-linear-gradient(-25deg, rgba(0,0,0,0.03) 0 2px, transparent 2px 40px)",
          }}
        />
        <div className="relative z-10 max-w-xs">
          <div className="rounded-2xl p-8 bg-white/60 backdrop-blur-sm shadow-2xl border border-white/30">
            <h2 className="text-4xl font-extrabold tracking-tight text-[#0b1220]">
              ServiceConnect
            </h2>
            <p className="mt-3 text-gray-600">
              Secure your account with a strong password.
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT FORM AREA */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.995 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="w-full max-w-lg"
        >
          {/* TOP BAR */}
          <div className="flex items-center justify-between mb-6 px-2">
            <button
              onClick={goBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 p-2 rounded-lg
                bg-white shadow-sm border border-white/60"
            >
              <ArrowLeft size={18} />
              <span className="text-sm">Back</span>
            </button>

            <div className="text-sm text-gray-500">Step 2 of 2</div>
          </div>

          {/* PROGRESS BAR */}
          <div className="relative h-3 rounded-full bg-[#f0f3f7] mb-8 shadow-inner border border-white/40">
            <motion.div
              initial={{ width: "50%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 0.6 }}
              className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-[#2b3140] to-[#3b485f]"
            />
          </div>

          {/* CARD */}
          <div
            className="bg-[#f8fbff] rounded-2xl p-10 shadow-[0_30px_60px_rgb(14,18,23,0.06)]
                       border border-white/60"
            style={{
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.6), 0 20px 45px rgba(10,14,24,0.06)",
            }}
          >
            <h1 className="text-3xl font-bold text-[#07102a]">
              Create Password
            </h1>
            <p className="mt-2 text-gray-500">
              Choose a strong password (minimum 6 characters).
            </p>

            {/* PASSWORD INPUT */}
            <div className="mt-6">
              <label className="block text-xs text-gray-500 mb-2">
                Password
              </label>

              <div
                className="relative rounded-xl bg-white p-4 border border-gray-100 shadow-sm"
                style={{ boxShadow: "inset 0 4px 18px rgba(15,20,30,0.03)" }}
              >
                <input
                  type={visible ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full bg-transparent outline-none text-base text-[#081226] placeholder:text-gray-300"
                />

                <button
                  type="button"
                  onClick={() => setVisible(!visible)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {visible ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* ACTIONS */}
            <div className="mt-8 flex items-center justify-between">
              <button
                onClick={() => router.push("/")}
                className="px-5 py-3 rounded-lg text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>

              <button
                onClick={submit}
                disabled={loading || password.length < 6}
                className={`inline-flex items-center gap-3 px-6 py-3 rounded-xl text-white font-medium
                ${
                  loading || password.length < 6
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-gradient-to-r from-[#0b1220] to-[#3b485f] shadow-lg"
                }`}
              >
                {loading && (
                  <svg
                    className="animate-spin h-4 w-4 mr-2 text-white"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8z"
                    ></path>
                  </svg>
                )}
                Create Account
              </button>
            </div>
          </div>

          {/* FOOTER */}
          <div className="mt-8 text-center text-xs text-gray-400">
            Your password is encrypted and never shared.
          </div>
        </motion.div>
      </div>
    </div>
  );
}