import { useState } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { supabase } from "../../../lib/supabaseClient";

export default function ProviderOnboardingStep1() {
  const router = useRouter();

  const [type, setType] = useState("freelancer");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  function goBack() {
    // Optional: prevent going back to auth
    router.replace("/login");
  }

  async function next() {
    if (!name.trim()) return;

    setLoading(true);

    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;

    if (!user) {
      router.replace("/login");
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        provider_type: type,
        full_name: name.trim(),
      })
      .eq("id", user.id);

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    router.push("/onboarding/provider/step2-phone");
  }

  return (
    <div className="min-h-screen flex bg-[#eef1f6]">
      {/* Left branding panel */}
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
              Let’s build your service profile.
            </p>
          </div>
        </div>
      </div>

      {/* Right section */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.995 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="w-full max-w-lg"
        >
          {/* Top controls */}
          <div className="flex items-center justify-between mb-6 px-2">
            <button
              onClick={goBack}
              className="flex items-center gap-2 text-gray-600 p-2 rounded-lg bg-white shadow-sm border border-white/60"
            >
              <ArrowLeft size={18} />
              <span className="text-sm">Back</span>
            </button>

            <div className="text-sm text-gray-500">Step 1 of 7</div>
          </div>

          {/* Progress bar */}
          <div className="relative h-3 rounded-full bg-[#f0f3f7] mb-8 shadow-inner border border-white/40">
            <motion.div
              initial={{ width: "0%" }}
              animate={{ width: "16%" }}
              transition={{ duration: 0.6 }}
              className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-[#2b3140] to-[#3b485f]"
            />
          </div>

          {/* Card */}
          <div className="bg-[#f8fbff] rounded-2xl p-10 shadow border border-white/60">
            <h1 className="text-3xl font-bold text-[#07102a]">
              Tell Us About Yourself
            </h1>

            {/* Toggle */}
            <div className="mt-6 bg-gray-100 border rounded-xl p-2 flex">
              <button
                onClick={() => setType("freelancer")}
                className={`w-1/2 py-3 rounded-lg ${
                  type === "freelancer"
                    ? "bg-white shadow"
                    : "text-gray-500"
                }`}
              >
                Freelancer
              </button>

              <button
                onClick={() => setType("business")}
                className={`w-1/2 py-3 rounded-lg ${
                  type === "business"
                    ? "bg-white shadow"
                    : "text-gray-500"
                }`}
              >
                Business
              </button>
            </div>

            {/* Name input */}
            <div className="mt-8">
              <label className="text-xs text-gray-500">
                {type === "business" ? "Business Name" : "Full Name"}
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-2 w-full p-4 rounded-xl border"
                placeholder={
                  type === "business"
                    ? "BrightFix Plumbing Services"
                    : "John Michael"
                }
              />
            </div>

            <div className="mt-8 flex justify-end">
              <button
                onClick={next}
                disabled={!name.trim() || loading}
                className="px-6 py-3 rounded-xl text-white bg-gradient-to-r from-[#0b1220] to-[#3b485f]"
              >
                Next →
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}