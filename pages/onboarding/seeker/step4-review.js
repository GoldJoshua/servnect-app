import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import TermsGateModal from "../../../components/TermsGateModal";

export default function SeekerOnboardingReview() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(null);

  // 🔒 TERMS GATE (UNCHANGED)
  const [termsAccepted, setTermsAccepted] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;

      if (!user) {
        router.replace("/login");
        return;
      }

      const { data: p, error } = await supabase
        .from("profiles")
        .select("full_name, phone, address, state")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error(error);
        alert("Failed to load profile. Please try again.");
        return;
      }

      setProfile(p);
    }

    load();
  }, [router]);

  async function finish() {
    if (loading) return;

    // 🔒 HARD BLOCK — TERMS MUST BE ACCEPTED
    if (!termsAccepted) {
      alert("You must agree to the Terms & Conditions to continue.");
      return;
    }

    setLoading(true);

    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;

    if (!user) {
      setLoading(false);
      router.replace("/login");
      return;
    }

    // ✅ RECORD TERMS ACCEPTANCE (UNCHANGED)
    await supabase
      .from("profiles")
      .update({
        terms_accepted: true,
        terms_type: "seeker",
        terms_version: "v1.0",
        terms_accepted_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    // ✅ FINALIZE ONBOARDING (UNCHANGED)
    const { error } = await supabase
      .from("profiles")
      .update({ onboarding_complete: true })
      .eq("id", user.id);

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    router.replace("/seeker/dashboard");
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen flex bg-[#eef1f6]">
      {/* 🔒 TERMS MODAL — UNCHANGED */}
      {!termsAccepted && (
        <TermsGateModal
          role="seeker"
          onAgree={() => setTermsAccepted(true)}
        />
      )}

      {/* LEFT BRAND PANEL (MATCHES STEP 3) */}
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
              Confirm your details before getting started.
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT CONTENT */}
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
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 p-2 rounded-lg
                         bg-white shadow-sm border border-white/60"
            >
              <ArrowLeft size={18} />
              <span className="text-sm">Back</span>
            </button>

            <div className="text-sm text-gray-500">Step 4 of 4</div>
          </div>

          {/* PROGRESS BAR */}
          <div className="relative h-3 rounded-full bg-[#f0f3f7] mb-8 shadow-inner border border-white/40">
            <motion.div
              initial={{ width: "75%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 0.6 }}
              className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-[#2b3140] to-[#3b485f]"
            />
          </div>

          {/* CARD */}
          <div
            className="bg-[#f8fbff] rounded-2xl p-10 shadow-[0_30px_60px_rgb(14,18,23,0.06)]
                       border border-white/60"
          >
            <h1 className="text-3xl font-bold text-[#07102a]">
              Review Your Details
            </h1>
            <p className="mt-2 text-gray-500">
              Please confirm everything before continuing.
            </p>

            <div className="mt-8 space-y-4 text-sm">
              <Review label="Full Name" value={profile.full_name} />
              <Review label="Phone" value={profile.phone} />
              <Review label="Address" value={profile.address} />
              <Review label="State" value={profile.state} />
            </div>

            {/* ACTIONS */}
            <div className="mt-10 flex items-center justify-between">
              <button
                onClick={() => router.push("/")}
                className="px-5 py-3 rounded-lg text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>

              <button
                onClick={finish}
                disabled={loading}
                className={`ml-4 inline-flex items-center gap-3 px-6 py-3 rounded-xl text-white font-medium
                  ${
                    loading
                      ? "bg-gray-300 cursor-not-allowed"
                      : "bg-gradient-to-r from-[#0b1220] to-[#3b485f] shadow-lg"
                  }`}
              >
                {loading ? "Finishing..." : "Finish"}
              </button>
            </div>
          </div>

          <div className="mt-8 text-center text-xs text-gray-400">
            Review and confirm your details to continue.
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function Review({ label, value }) {
  return (
    <div className="flex justify-between bg-gray-50 p-3 rounded-xl">
      <span className="font-medium text-gray-500">{label}</span>
      <span className="font-semibold text-[#0b1220]">
        {value || "—"}
      </span>
    </div>
  );
}