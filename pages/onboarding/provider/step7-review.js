import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { supabase } from "../../../lib/supabaseClient";
import TermsGateModal from "../../../components/TermsGateModal";

export default function ProviderStep7Review() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // 🔒 TERMS GATE
  const [termsAccepted, setTermsAccepted] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);

      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;

      if (!user) {
        router.replace("/login");
        return;
      }

      // 1) Profile (DB source of truth)
      const { data: profile, error: pErr } = await supabase
        .from("profiles")
        .select("first_name,last_name,phone,state")
        .eq("id", user.id)
        .single();

      if (pErr || !profile) {
        console.error(pErr);
        alert("Failed to load your profile. Please try again.");
        setLoading(false);
        return;
      }

      // 2) Provider service (subcategory + category)
      let categoryName = "";
      let subcategoryName = "";

      const { data: svcNested, error: sNestedErr } = await supabase
        .from("provider_services")
        .select(
          `
          subcategory_id,
          service_subcategories (
            id, name, category_id,
            service_categories ( id, name )
          )
        `
        )
        .eq("provider_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!sNestedErr && svcNested?.service_subcategories) {
        subcategoryName = svcNested.service_subcategories?.name || "";
        categoryName =
          svcNested.service_subcategories?.service_categories?.name || "";
      } else {
        const { data: svcRow } = await supabase
          .from("provider_services")
          .select("subcategory_id")
          .eq("provider_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (svcRow?.subcategory_id) {
          const { data: subRow } = await supabase
            .from("service_subcategories")
            .select("id,name,category_id")
            .eq("id", svcRow.subcategory_id)
            .maybeSingle();

          subcategoryName = subRow?.name || "";

          if (subRow?.category_id) {
            const { data: catRow } = await supabase
              .from("service_categories")
              .select("id,name")
              .eq("id", subRow.category_id)
              .maybeSingle();

            categoryName = catRow?.name || "";
          }
        }
      }

      setData({
        name: `${profile.first_name || ""} ${profile.last_name || ""}`.trim(),
        email: user.email || "",
        phone: profile.phone || "",
        state: profile.state || "",
        category: categoryName,
        subcategory: subcategoryName,
      });

      setLoading(false);
    }

    load();
  }, [router]);

  async function submit() {
    if (submitting) return;

    // 🔒 HARD BLOCK — TERMS MUST BE ACCEPTED
    if (!termsAccepted) {
      alert("You must agree to the Terms & Conditions to continue.");
      return;
    }

    setSubmitting(true);

    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;

    if (!user) {
      alert("Session expired. Please login again.");
      router.replace("/login");
      return;
    }

    // ✅ RECORD TERMS ACCEPTANCE
    await supabase
      .from("profiles")
      .update({
        terms_accepted: true,
        terms_type: "provider",
        terms_version: "v1.0",
        terms_accepted_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    // ✅ FINALIZE ONBOARDING
    const { error } = await supabase
      .from("profiles")
      .update({ onboarding_complete: true })
      .eq("id", user.id);

    if (error) {
      console.error(error);
      alert("Failed to complete onboarding. Please try again.");
      setSubmitting(false);
      return;
    }

    router.replace("/provider/dashboard");
  }

  if (loading) return null;
  if (!data) return null;

  return (
    <div className="min-h-screen flex bg-[#eef1f6]">
      {/* 🔒 TERMS MODAL — FORCED */}
      {!termsAccepted && (
        <TermsGateModal
          role="provider"
          onAgree={() => setTermsAccepted(true)}
        />
      )}

      {/* LEFT BRAND */}
      <div
        className="hidden lg:flex w-1/2 bg-gradient-to-br from-[#f8fafc] to-[#edf2f7]
        p-12 items-center justify-center"
      >
        <h2 className="text-4xl font-extrabold text-[#0b1220]">
          ServiceConnect
        </h2>
      </div>

      {/* RIGHT */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-16">
        <motion.div className="w-full max-w-lg">
          <div className="flex items-center justify-between mb-6 px-2">
            <button
              onClick={() => router.push("/onboarding/provider/step6-bio")}
              className="flex items-center gap-2 text-gray-600 p-2 rounded-lg
              bg-white shadow-sm border border-white/60"
            >
              <ArrowLeft size={18} /> Back
            </button>
            <span className="text-sm text-gray-500">Step 7 of 7</span>
          </div>

          <div className="relative h-3 rounded-full bg-[#f0f3f7] mb-8">
            <div
              className="absolute w-full h-full rounded-full bg-gradient-to-r
              from-[#2b3140] to-[#3b485f]"
            />
          </div>

          <div className="bg-[#f8fbff] rounded-2xl p-10 shadow border border-white/60">
            <h1 className="text-3xl font-bold text-[#07102a]">
              Review Your Details
            </h1>

            <div className="mt-8 space-y-3 text-sm">
              <Review label="Name" value={data.name} />
              <Review label="Email" value={data.email} />
              <Review label="Phone" value={data.phone} />
              <Review label="State" value={data.state} />
              <Review label="Category" value={data.category} />
              <Review label="Service" value={data.subcategory} />
            </div>

            <div className="mt-10 flex justify-end">
              <button
                onClick={submit}
                disabled={submitting}
                className="px-6 py-3 rounded-xl text-white font-medium
                bg-gradient-to-r from-[#0b1220] to-[#3b485f]"
              >
                {submitting ? "Submitting…" : "Complete Onboarding"}
              </button>
            </div>
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
      <span className="font-semibold text-[#0b1220]">{value || "—"}</span>
    </div>
  );
}