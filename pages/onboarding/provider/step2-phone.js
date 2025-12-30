import { useState } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { supabase } from "../../../lib/supabaseClient";

export default function ProviderOnboardingStep2Phone() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function goBack() {
    router.push("/onboarding/provider/step1-full-name");
  }

  function validatePhone(num) {
    const cleaned = num.replace(/\D/g, "");

    if (
      cleaned.startsWith("070") ||
      cleaned.startsWith("080") ||
      cleaned.startsWith("081") ||
      cleaned.startsWith("090") ||
      cleaned.startsWith("091")
    ) {
      return cleaned.length === 11;
    }

    return false;
  }

  async function next() {
    if (!validatePhone(phone)) {
      setError("Enter a valid Nigerian phone number (e.g. 08012345678)");
      return;
    }

    setLoading(true);

    // 🔑 AUTH USER MUST EXIST
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;

    if (!user) {
      router.replace("/login");
      return;
    }

    // ✅ SAVE TO DB (SOURCE OF TRUTH)
    const { error: dbError } = await supabase
      .from("profiles")
      .update({ phone })
      .eq("id", user.id);

    if (dbError) {
      setError("Failed to save phone number. Please try again.");
      setLoading(false);
      return;
    }

    setLoading(false);
    router.push("/onboarding/provider/step3-address");
  }

  return (
    <div className="min-h-screen flex bg-[#eef1f6]">
      {/* LEFT SIDE BRAND PANEL */}
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
              Verified service providers gain customer trust instantly.
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

            <div className="text-sm text-gray-500">Step 2 of 7</div>
          </div>

          {/* PROGRESS BAR */}
          <div className="relative h-3 rounded-full bg-[#f0f3f7] mb-8 shadow-inner border border-white/40">
            <motion.div
              initial={{ width: "16%" }}
              animate={{ width: "32%" }}
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
            <h1 className="text-3xl font-bold text-[#07102a]">Phone Number</h1>
            <p className="mt-2 text-gray-500">
              Customers may use this for communication and bookings.
            </p>

            {/* INPUT */}
            <div className="mt-6">
              <label className="block text-xs text-gray-500 mb-2">
                Nigerian phone number
              </label>

              <div
                className="relative rounded-xl bg-white p-4 border border-gray-100 shadow-sm"
                style={{ boxShadow: "inset 0 4px 18px rgba(15,20,30,0.03)" }}
              >
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    setError("");
                  }}
                  placeholder="08012345678"
                  className="w-full bg-transparent outline-none text-base text-[#081226] placeholder:text-gray-300"
                />
              </div>
            </div>

            {/* ERROR */}
            {error && (
              <p className="mt-3 text-sm text-gray-500">{error}</p>
            )}

            {/* ACTIONS */}
            <div className="mt-8 flex items-center justify-between">
              <button
                onClick={() => router.push("/")}
                className="px-5 py-3 rounded-lg text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>

              <button
                onClick={next}
                disabled={loading}
                className={`inline-flex items-center gap-3 px-6 py-3 rounded-xl text-white font-medium
                ${
                  loading
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
                Next
              </button>
            </div>
          </div>

          {/* FOOTER */}
          <div className="mt-8 text-center text-xs text-gray-400">
            By continuing, you agree to our Terms and Privacy Policy.
          </div>
        </motion.div>
      </div>
    </div>
  );
}