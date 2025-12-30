import { useState } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { supabase } from "../../../lib/supabaseClient";

export default function Step1FullName() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function next() {
    if (!name.trim() || loading) return;

    setLoading(true);

    // 🔑 Must be logged in already (onboarding is AFTER signup)
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;

    if (!user) {
      setLoading(false);
      router.replace("/login");
      return;
    }

    // ✅ SAVE TO DB (SOURCE OF TRUTH)
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: name.trim() })
      .eq("id", user.id);

    if (error) {
      console.error(error);
      alert("Failed to save name. Please try again.");
      setLoading(false);
      return;
    }

    setLoading(false);
    router.push("/onboarding/seeker/step2-phone");
  }

  return (
    <div className="min-h-screen flex bg-[#eef1f6]">
      {/* LEFT BRANDING PANEL */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-[#f8fafc] to-[#edf2f7] p-12 items-center justify-center relative">
        <div
          aria-hidden
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
              Find trusted professionals. Book with confidence.
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.995 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="w-full max-w-lg"
        >
          {/* Top Controls */}
          <div className="flex items-center justify-between mb-6 px-2">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 p-2 rounded-lg bg-white shadow-sm border border-white/60"
            >
              <ArrowLeft size={18} />
              <span className="text-sm">Back</span>
            </button>

            <div className="text-sm text-gray-500">Step 1 of 4</div>
          </div>

          {/* Progress Bar */}
          <div className="relative h-3 rounded-full bg-[#f0f3f7] mb-8 shadow-inner border border-white/40">
            <motion.div
              initial={{ width: "0%" }}
              animate={{ width: "25%" }}
              transition={{ duration: 0.6 }}
              className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-[#2b3140] to-[#3b485f]"
            />
          </div>

          {/* Card */}
          <div
            className="bg-[#f8fbff] rounded-2xl p-10 shadow-[0_30px_60px_rgb(14,18,23,0.06)] border border-white/60"
            style={{
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.6), 0 20px 45px rgba(10,14,24,0.06)",
            }}
          >
            <h1 className="text-3xl font-bold text-[#07102a]">Your Name</h1>
            <p className="mt-2 text-gray-500">
              Let us know how we should address you.
            </p>

            <div className="mt-6">
              <label className="block text-xs text-gray-500 mb-2">
                Full Name
              </label>

              <div
                className="relative rounded-xl bg-white p-4 border border-gray-100 shadow-sm"
                style={{ boxShadow: "inset 0 4px 18px rgba(15,20,30,0.03)" }}
              >
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Gold"
                  className="w-full bg-transparent outline-none text-base text-[#081226] placeholder:text-gray-300"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="mt-8 flex items-center justify-between">
              <button
                onClick={() => router.push("/")}
                className="px-5 py-3 rounded-lg text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>

              <button
                onClick={next}
                disabled={loading || !name.trim()}
                className={`ml-4 inline-flex items-center gap-3 px-6 py-3 rounded-xl text-white font-medium
                  ${
                    loading || !name.trim()
                      ? "bg-gray-300 cursor-not-allowed"
                      : "bg-gradient-to-r from-[#0b1220] to-[#3b485f] shadow-lg"
                  }`}
              >
                {loading ? "..." : "Next"}
              </button>
            </div>
          </div>

          <div className="mt-8 text-center text-xs text-gray-400">
            By continuing you agree to our Terms and Privacy Policy.
          </div>
        </motion.div>
      </div>
    </div>
  );
}