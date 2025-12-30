// pages/onboarding/provider/step5-experience.js
import { useState } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { supabase } from "../../../lib/supabaseClient";

const EXPERIENCE_LEVELS = [
  "Less than 1 year",
  "1 - 2 years",
  "3 - 5 years",
  "6 - 10 years",
  "Over 10 years",
];

export default function ProviderStep5Experience() {
  const router = useRouter();
  const [experience, setExperience] = useState("");
  const [saving, setSaving] = useState(false);

  function goBack() {
    router.push("/onboarding/provider/step4-category");
  }

  async function next() {
    if (!experience || saving) return;

    setSaving(true);

    // 🔑 Auth user must exist
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;

    if (!user) {
      alert("Session expired. Please login again.");
      router.replace("/login");
      return;
    }

    // ✅ SAVE TO DATABASE (SOURCE OF TRUTH)
    const { error } = await supabase
      .from("profiles")
      .update({ experience })
      .eq("id", user.id);

    if (error) {
      console.error(error);
      alert("Failed to save experience. Please try again.");
      setSaving(false);
      return;
    }

    setSaving(false);
    router.push("/onboarding/provider/step6-bio");
  }

  return (
    <div className="min-h-screen flex bg-[#eef1f6]">
      {/* LEFT PANEL */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-[#f8fafc] to-[#edf2f7] p-12 items-center justify-center overflow-hidden relative">
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
              Tell clients how long you've been doing this.
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
          {/* HEADER */}
          <div className="flex items-center justify-between mb-6 px-2">
            <button
              onClick={goBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 p-2 rounded-lg
              bg-white shadow-sm border border-white/60"
            >
              <ArrowLeft size={18} />
              <span className="text-sm">Back</span>
            </button>

            <div className="text-sm text-gray-500">Step 5 of 7</div>
          </div>

          {/* PROGRESS BAR */}
          <div className="relative h-3 rounded-full bg-[#f0f3f7] mb-8 shadow-inner border border-white/40">
            <motion.div
              initial={{ width: "60%" }}
              animate={{ width: "80%" }}
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
              Experience Level
            </h1>
            <p className="mt-2 text-gray-500">
              Select how long you've been offering this service.
            </p>

            <div className="mt-6">
              <label className="block text-xs text-gray-500 mb-2">
                Years of Experience
              </label>

              <div className="relative rounded-xl bg-white p-4 border border-gray-100 shadow-sm">
                <select
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  className="w-full bg-transparent outline-none text-base text-[#081226]"
                >
                  <option value="">Select experience level</option>
                  {EXPERIENCE_LEVELS.map((exp) => (
                    <option key={exp}>{exp}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-10 flex items-center justify-end">
              <button
                onClick={next}
                disabled={!experience || saving}
                className={`inline-flex items-center gap-3 px-6 py-3 rounded-xl text-white font-medium
                ${
                  !experience || saving
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-gradient-to-r from-[#0b1220] to-[#3b485f] shadow-lg"
                }`}
              >
                {saving ? "Saving..." : "Next"}
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