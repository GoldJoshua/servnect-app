import { useState } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { supabase } from "../../../lib/supabaseClient";

export default function ProviderStep6Bio() {
  const router = useRouter();

  const [website, setWebsite] = useState("");
  const [areas, setAreas] = useState("");
  const [hours, setHours] = useState("");
  const [emergency, setEmergency] = useState(false);
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);

  function goBack() {
    router.push("/onboarding/provider/step5-experience");
  }

  async function next() {
    if (saving) return;
    setSaving(true);

    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;

    if (!user) {
      alert("Session expired. Please login again.");
      router.replace("/login");
      return;
    }

    // ✅ SAVE OPTIONAL INFO ONLY — NO FINALIZE
    const { error } = await supabase
      .from("profiles")
      .update({
        website: website.trim() || null,
        service_areas: areas.trim() || null,
        work_hours: hours.trim() || null,
        emergency_service: emergency,
        bio: bio.trim() || null,
      })
      .eq("id", user.id);

    if (error) {
      console.error(error);
      alert("Failed to save details. Please try again.");
      setSaving(false);
      return;
    }

    setSaving(false);
    router.push("/onboarding/provider/step7-review");
  }

  return (
    <div className="min-h-screen flex bg-[#eef1f6]">
      {/* LEFT PANEL BRANDING */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-[#f8fafc] to-[#edf2f7]
        p-12 items-center justify-center overflow-hidden relative">
        <div
          aria-hidden
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
              Add optional details to improve trust and visibility.
            </p>
          </div>
        </div>
      </div>

      {/* RIGHT FORM AREA */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.99 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45 }}
          className="w-full max-w-lg"
        >
          {/* TOP BAR */}
          <div className="flex items-center justify-between mb-6 px-2">
            <button
              onClick={goBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800
              p-2 rounded-lg bg-white shadow-sm border border-white/60"
            >
              <ArrowLeft size={18} />
              <span className="text-sm">Back</span>
            </button>

            <div className="text-sm text-gray-500">Step 6 of 7</div>
          </div>

          {/* PROGRESS BAR */}
          <div className="relative h-3 rounded-full bg-[#f0f3f7] mb-8 shadow-inner
            border border-white/40">
            <motion.div
              initial={{ width: "80%" }}
              animate={{ width: "90%" }}
              transition={{ duration: 0.6 }}
              className="absolute left-0 top-0 h-full rounded-full
              bg-gradient-to-r from-[#2b3140] to-[#3b485f]"
            />
          </div>

          {/* FORM CARD */}
          <div
            className="bg-[#f8fbff] rounded-2xl p-10 shadow-[0_30px_60px_rgb(14,18,23,0.06)]
              border border-white/60"
            style={{
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.6), 0 20px 45px rgba(10,14,24,0.06)"
            }}
          >
            <h1 className="text-3xl font-bold text-[#07102a]">
              Optional Information
            </h1>

            <p className="mt-2 text-gray-500">
              These details help clients understand your service better.
            </p>

            {/* WEBSITE */}
            <div className="mt-6">
              <label className="text-xs text-gray-500 mb-2 block">
                Website (optional)
              </label>
              <div className="relative rounded-xl bg-white p-4 border border-gray-100 shadow-sm">
                <input
                  type="text"
                  placeholder="https://yourwebsite.com"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full bg-transparent outline-none text-base"
                />
              </div>
            </div>

            {/* SERVICE AREAS */}
            <div className="mt-6">
              <label className="text-xs text-gray-500 mb-2 block">
                Service Areas (comma-separated)
              </label>
              <div className="relative rounded-xl bg-white p-4 border border-gray-100 shadow-sm">
                <input
                  type="text"
                  placeholder="Ikeja, Lekki, Surulere..."
                  value={areas}
                  onChange={(e) => setAreas(e.target.value)}
                  className="w-full bg-transparent outline-none text-base"
                />
              </div>
            </div>

            {/* WORK HOURS */}
            <div className="mt-6">
              <label className="text-xs text-gray-500 mb-2 block">
                Work Hours (optional)
              </label>
              <div className="relative rounded-xl bg-white p-4 border border-gray-100 shadow-sm">
                <input
                  type="text"
                  placeholder="Mon–Sat, 8am–6pm"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  className="w-full bg-transparent outline-none text-base"
                />
              </div>
            </div>

            {/* EMERGENCY */}
            <div className="mt-6">
              <label className="text-xs text-gray-500 mb-2 block">
                Emergency Service
              </label>
              <div className="mt-2 flex gap-4">
                <button
                  onClick={() => setEmergency(true)}
                  className={`px-4 py-2 rounded-xl ${
                    emergency
                      ? "bg-[#0b1220] text-white shadow"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  Yes
                </button>

                <button
                  onClick={() => setEmergency(false)}
                  className={`px-4 py-2 rounded-xl ${
                    !emergency
                      ? "bg-[#0b1220] text-white shadow"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  No
                </button>
              </div>
            </div>

            {/* BIO */}
            <div className="mt-6">
              <label className="text-xs text-gray-500 mb-2 block">
                About Your Business
              </label>
              <div className="relative rounded-xl bg-white p-4 border border-gray-100 shadow-sm">
                <textarea
                  placeholder="Tell clients a little about your work..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full h-28 bg-transparent outline-none text-base resize-none"
                />
              </div>
            </div>

            {/* NEXT */}
            <div className="mt-10 flex justify-end">
              <button
                onClick={next}
                disabled={saving}
                className={`inline-flex items-center gap-3 px-6 py-3 rounded-xl
                ${
                  saving
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-gradient-to-r from-[#0b1220] to-[#3b485f] text-white shadow-lg"
                }`}
              >
                {saving ? "Saving..." : "Next →"}
              </button>
            </div>
          </div>

          <div className="mt-8 text-center text-xs text-gray-400">
            These details are optional but improve your profile quality.
          </div>
        </motion.div>
      </div>
    </div>
  );
}