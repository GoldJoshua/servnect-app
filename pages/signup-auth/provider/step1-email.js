import { useState } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

export default function ProviderSignupEmail() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  function goBack() {
    router.push("/signup-auth/choose-role");
  }

  function next() {
    if (!email || !email.includes("@")) return;

    setLoading(true);

    // TEMP: email only for auth signup
    localStorage.setItem("auth_signup_email", email.trim());

    setTimeout(() => {
      setLoading(false);
      router.push("/signup-auth/provider/step2-password");
    }, 400);
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
              Let customers discover and hire your services.
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT CONTENT AREA */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.995 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="w-full max-w-lg"
        >
          {/* TOP CONTROLS */}
          <div className="flex items-center justify-between mb-6 px-2">
            <button
              onClick={goBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 p-2 rounded-lg bg-white shadow-sm border border-white/60"
            >
              <ArrowLeft size={18} />
              <span className="text-sm">Back</span>
            </button>

            <div className="text-sm text-gray-500">Step 1 of 2</div>
          </div>

          {/* PROGRESS BAR */}
          <div className="relative h-3 rounded-full bg-[#f0f3f7] mb-8 shadow-inner border border-white/40">
            <motion.div
              initial={{ width: "0%" }}
              animate={{ width: "50%" }}
              transition={{ duration: 0.6 }}
              className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-[#2b3140] to-[#3b485f]"
            />
          </div>

          {/* FORM CARD */}
          <div
            className="bg-[#f8fbff] rounded-2xl p-10 shadow-[0_30px_60px_rgb(14,18,23,0.06)] border border-white/60"
            style={{
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.6), 0 20px 45px rgba(10,14,24,0.06)",
            }}
          >
            <h1 className="text-3xl font-bold text-[#07102a]">
              Your Email Address
            </h1>
            <p className="mt-2 text-gray-500">
              We’ll use this to create your account.
            </p>

            {/* Email Input */}
            <div className="mt-6">
              <label className="block text-xs text-gray-500 mb-2">
                Email address
              </label>

              <div className="relative rounded-xl bg-white p-4 border border-gray-100 shadow-sm">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@provider.com"
                  className="w-full bg-transparent outline-none text-base text-[#081226] placeholder:text-gray-300"
                />
              </div>
            </div>

            {/* Safety message */}
            <p className="mt-3 text-sm text-gray-400">
              We’ll send you a verification email after signup.
            </p>

            {/* ACTION BUTTONS */}
            <div className="mt-8 flex items-center justify-between">
              <button
                onClick={() => router.push("/")}
                className="px-5 py-3 rounded-lg text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>

              <button
                onClick={next}
                disabled={loading || !email.includes("@")}
                className={`inline-flex items-center gap-3 px-6 py-3 rounded-xl text-white font-medium
                ${
                  loading || !email.includes("@")
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-gradient-to-r from-[#0b1220] to-[#3b485f] shadow-lg"
                }`}
              >
                {loading ? "Please wait…" : "Next"}
              </button>
            </div>
          </div>

          <div className="mt-8 text-center text-xs text-gray-400">
            By continuing, you agree to our Terms and Privacy Policy.
          </div>
        </motion.div>
      </div>
    </div>
  );
}