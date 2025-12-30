import { useState } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { supabase } from "../../../lib/supabaseClient";

const NIGERIA_STATES = [
  "Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno",
  "Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","Gombe","Imo","Jigawa",
  "Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa","Niger",
  "Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto","Taraba","Yobe","Zamfara",
  "FCT Abuja"
];

export default function ProviderOnboardingStep3Address() {
  const router = useRouter();

  const [address, setAddress] = useState("");
  const [state, setState] = useState("");
  const [loading, setLoading] = useState(false);

  function goBack() {
    router.push("/onboarding/provider/step2-phone");
  }

  async function next() {
    if (!address || !state) return;

    setLoading(true);

    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;

    if (!user) {
      router.replace("/login");
      return;
    }

    // ✅ SAVE TO DATABASE (ONLY SOURCE OF TRUTH)
    const { error } = await supabase
      .from("profiles")
      .update({
        state,
        address: address.trim(),
      })
      .eq("id", user.id);

    if (error) {
      alert("Failed to save address. Please try again.");
      setLoading(false);
      return;
    }

    router.push("/onboarding/provider/step4-category");
  }

  return (
    <div className="min-h-screen flex bg-[#eef1f6]">
      {/* LEFT PANEL */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-[#f8fafc] to-[#edf2f7] 
                      p-12 items-center justify-center relative overflow-hidden">

        <div
          aria-hidden
          className="absolute inset-0 opacity-5"
          style={{
            background:
              "repeating-linear-gradient(-25deg, rgba(0,0,0,0.03) 0 2px, transparent 2px 40px)",
          }}
        />

        <div className="relative z-10 max-w-xs">
          <div className="rounded-2xl p-8 bg-white/60 backdrop-blur-sm shadow-2xl 
                          border border-white/30">
            <h2 className="text-4xl font-extrabold tracking-tight text-[#0b1220]">
              ServiceConnect
            </h2>
            <p className="mt-3 text-gray-600">
              Help customers find you more easily.
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
          {/* Top controls */}
          <div className="flex items-center justify-between mb-6 px-2">
            <button
              onClick={goBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 p-2 rounded-lg
                bg-white shadow-sm border border-white/60"
            >
              <ArrowLeft size={18} />
              <span className="text-sm">Back</span>
            </button>

            <div className="text-sm text-gray-500">Step 3 of 7</div>
          </div>

          {/* Progress bar */}
          <div className="relative h-3 rounded-full bg-[#f0f3f7] mb-8 shadow-inner border border-white/40">
            <motion.div
              initial={{ width: "32%" }}
              animate={{ width: "48%" }}
              transition={{ duration: 0.6 }}
              className="absolute left-0 top-0 h-full rounded-full 
                         bg-gradient-to-r from-[#2b3140] to-[#3b485f]"
            />
          </div>

          {/* Card */}
          <div
            className="bg-[#f8fbff] rounded-2xl p-10 shadow-[0_30px_60px_rgb(14,18,23,0.06)]
                       border border-white/60"
          >
            <h1 className="text-3xl font-bold text-[#07102a]">Your Address</h1>
            <p className="mt-2 text-gray-500">
              We use this to match you with customers near you.
            </p>

            {/* Address field */}
            <div className="mt-6">
              <label className="block text-xs text-gray-500 mb-2">
                Street Address
              </label>
              <div className="relative rounded-xl bg-white p-4 border border-gray-100 shadow-sm">
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. 22 Herbert Macaulay Crescent"
                  className="w-full bg-transparent outline-none text-base text-[#081226]"
                />
              </div>
            </div>

            {/* State dropdown */}
            <div className="mt-6">
              <label className="block text-xs text-gray-500 mb-2">State</label>
              <div className="relative rounded-xl bg-white p-4 border border-gray-100 shadow-sm">
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full bg-transparent outline-none text-base"
                >
                  <option value="">Select State</option>
                  {NIGERIA_STATES.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
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
                disabled={!address || !state || loading}
                className={`px-6 py-3 rounded-xl text-white font-medium
                ${
                  !address || !state || loading
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-gradient-to-r from-[#0b1220] to-[#3b485f] shadow-lg"
                }`}
              >
                {loading ? "Saving..." : "Next"}
              </button>
            </div>
          </div>

          <div className="mt-8 text-center text-xs text-gray-400">
            Your information helps us match you with the right clients.
          </div>
        </motion.div>
      </div>
    </div>
  );
}