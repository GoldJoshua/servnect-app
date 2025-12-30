// 🔒 AUTH LOCKED – DO NOT MODIFY
// This file controls authentication & routing logic.
// Changes here can break login/signup flows.
// // pages/login/index.js
import { useState } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

export default function LoginEmail() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function next() {
    if (!email.includes("@")) return;

    setLoading(true);
    setError("");

    // Attempt sign-in with wrong password to detect if email exists
    const { error: authErr } = await supabase.auth.signInWithPassword({
      email,
      password: "this-is-not-the-real-password",
    });

    // 400 = email exists but password wrong → GOOD
    if (authErr?.status === 400) {
      localStorage.setItem("login_email", email);
      setLoading(false);
      router.push("/login/password");
      return;
    }

    // 422 = email does not exist
    if (authErr?.status === 422) {
      setError("Email not found.");
      setLoading(false);
      return;
    }

    // Other error
    setError("Unexpected error. Try again.");
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex bg-[#eef1f6]">
      {/* LEFT PANEL */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-[#f8fafc] to-[#edf2f7]
        p-12 items-center justify-center relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-5"
          style={{
            background:
              "repeating-linear-gradient(-25deg, rgba(0,0,0,0.02) 0 2px, transparent 2px 40px)",
          }}
        />

        <div className="relative z-10 max-w-xs">
          <div className="rounded-2xl p-8 bg-white/60 backdrop-blur-sm shadow-2xl
            border border-white/30">
            <h2 className="text-4xl font-extrabold tracking-tight text-[#0b1220]">
              ServiceConnect
            </h2>
            <p className="mt-3 text-gray-600">
              Welcome back. Log in securely to continue.
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT FORM */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.995 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45 }}
          className="w-full max-w-lg"
        >
          {/* TOP BAR */}
          <div className="flex items-center justify-between mb-6 px-2">
            <button
              onClick={() => {
                window.location.href = "https://servnect.com";
              }}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 p-2
                rounded-lg bg-white shadow-sm border border-white/60"
            >
              <ArrowLeft size={18} />
              <span className="text-sm">Back</span>
            </button>

            <div className="text-sm text-gray-500">Login</div>
          </div>

          {/* CARD */}
          <div
            className="bg-[#f8fbff] rounded-2xl p-10 shadow-[0_30px_60px_rgb(14,18,23,0.06)]
              border border-white/60"
          >
            <h1 className="text-3xl font-bold text-[#07102a]">Enter Your Email</h1>
            <p className="mt-2 text-gray-500">We'll check if your account exists.</p>

            <div className="mt-6">
              <label className="text-xs text-gray-500 mb-2 block">Email</label>

              <div className="rounded-xl bg-white p-4 border border-gray-100 shadow-sm">
                <input
                  type="email"
                  value={email}
                  placeholder="you@example.com"
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent outline-none text-base"
                />
              </div>
            </div>

            {error && <p className="text-gray-500 text-sm mt-3">{error}</p>}

            {/* Actions */}
            <div className="mt-8 flex items-center justify-between">
              <button
                onClick={() => alert("Forgot email flow coming soon")}
                className="px-5 py-3 rounded-lg text-sm text-gray-600 hover:text-gray-800"
              >
                Forgot email?
              </button>

              <button
                onClick={next}
                disabled={!email.includes("@") || loading}
                className={`px-6 py-3 rounded-xl text-white font-medium ${
                  !email.includes("@") || loading
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-gradient-to-r from-[#0b1220] to-[#3b485f] shadow-lg"
                }`}
              >
                {loading ? "Checking..." : "Next →"}
              </button>
            </div>
          </div>

          {/* FOOTER */}
          <p className="mt-8 text-center text-xs text-gray-400">
            Need an account?{" "}
            <a href="/signup-auth/choose-role" className="text-[#0b1220] font-medium">
              Sign up
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  );
}