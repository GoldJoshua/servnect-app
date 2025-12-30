import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { supabase } from "../../../lib/supabaseClient";

const STATES = [
  "Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno",
  "Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","Gombe","Imo","Jigawa",
  "Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa","Niger",
  "Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto","Taraba","Yobe",
  "Zamfara","FCT Abuja"
];

export default function Step3Address() {
  const router = useRouter();

  const [address, setAddress] = useState("");
  const [state, setState] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ REAL-TIME PROVIDER COUNT STATES
  const [checkingProviders, setCheckingProviders] = useState(false);
  const [providerCount, setProviderCount] = useState(null);

  function goBack() {
    router.push("/onboarding/seeker/step2-phone");
  }

  // 🔴 REAL-TIME CHECK WHEN STATE CHANGES
  useEffect(() => {
    if (!state) {
      setProviderCount(null);
      return;
    }

    async function checkProviders() {
      setCheckingProviders(true);

      const { count } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "provider")
        .eq("state", state);

      setProviderCount(count || 0);
      setCheckingProviders(false);
    }

    checkProviders();
  }, [state]);

  async function next() {
    if (!address.trim() || !state || loading) return;
    setLoading(true);

    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;

    if (!user) {
      setLoading(false);
      router.replace("/login");
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        address: address.trim(),
        state: state,
      })
      .eq("id", user.id);

    if (error) {
      console.error(error);
      alert("Failed to save address. Please try again.");
      setLoading(false);
      return;
    }

    setLoading(false);
    router.push("/onboarding/seeker/step4-review");
  }

  // 🧠 MESSAGE LOGIC (STRICT TO YOUR RULES)
  function renderProviderMessage() {
    if (!state) return null;
    if (checkingProviders) {
      return (
        <p className="mt-2 text-xs text-gray-500">
          Checking providers in your location…
        </p>
      );
    }

    if (providerCount === 0) {
      return (
        <p className="mt-2 text-xs text-amber-600">
          There are no providers in your location yet. Providers coming soon.
        </p>
      );
    }

    if (providerCount < 100) {
      return (
        <p className="mt-2 text-xs text-amber-600">
          You currently have less than 100 providers in your location. More
          providers coming soon.
        </p>
      );
    }

    const rounded =
      providerCount >= 1000
        ? `${Math.floor(providerCount / 1000) * 1000}+`
        : providerCount;

    return (
      <p className="mt-2 text-xs text-green-600 font-medium">
        Congratulations 🎉 There are {rounded} providers in your location.
      </p>
    );
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
              Find trusted professionals near you.
            </p>
          </div>
        </div>
      </div>

      {/* Right form area */}
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

            <div className="text-sm text-gray-500">Step 3 of 4</div>
          </div>

          {/* Progress bar */}
          <div className="relative h-3 rounded-full bg-[#f0f3f7] mb-8 shadow-inner border border-white/40">
            <motion.div
              initial={{ width: "50%" }}
              animate={{ width: "75%" }}
              transition={{ duration: 0.6 }}
              className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-[#2b3140] to-[#3b485f]"
            />
          </div>

          {/* Card */}
          <div
            className="bg-[#f8fbff] rounded-2xl p-10 shadow-[0_30px_60px_rgb(14,18,23,0.06)]
                       border border-white/60"
          >
            <h1 className="text-3xl font-bold text-[#07102a]">Your Location</h1>
            <p className="mt-2 text-gray-500">
              This helps us match you with the best providers.
            </p>

            {/* Address */}
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
                  className="w-full bg-transparent outline-none text-base text-[#081226] placeholder:text-gray-300"
                />
              </div>
            </div>

            {/* State */}
            <div className="mt-6">
              <label className="block text-xs text-gray-500 mb-2">State</label>
              <div className="relative rounded-xl bg-white p-4 border border-gray-100 shadow-sm">
                <select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full bg-transparent outline-none text-base text-[#081226]"
                >
                  <option value="">Select a state</option>
                  {STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* ✅ REAL-TIME MESSAGE */}
              {renderProviderMessage()}
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
                disabled={!address.trim() || !state || loading}
                className={`ml-4 inline-flex items-center gap-3 px-6 py-3 rounded-xl text-white font-medium
                  ${
                    !address.trim() || !state || loading
                      ? "bg-gray-300 cursor-not-allowed"
                      : "bg-gradient-to-r from-[#0b1220] to-[#3b485f] shadow-lg"
                  }`}
              >
                {loading ? "..." : "Next"}
              </button>
            </div>
          </div>

          <div className="mt-8 text-center text-xs text-gray-400">
            Your location helps us match you with the best providers.
          </div>
        </motion.div>
      </div>
    </div>
  );
}