// pages/seeker/find.js

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/router";
import RequireRole from "../../components/auth/RequireRole";
import SeekerLayout from "../../components/layouts/SeekerLayout";
import ProviderDiscoveryCard from "../../components/seeker/ProviderDiscoveryCard";
import { ArrowLeft } from "lucide-react";

function FindServicesContent() {
  const router = useRouter();

  const [seekerState, setSeekerState] = useState(null);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [providers, setProviders] = useState([]);

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [loading, setLoading] = useState(true);

  // ─────────────────────────────────────────────
  // LOAD SEEKER STATE
  // ─────────────────────────────────────────────
  useEffect(() => {
    async function loadProfile() {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth?.user?.id;
      if (!uid) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("state")
        .eq("id", uid)
        .single();

      if (!profile?.state) {
        alert("Please update your state in Settings to find services.");
        setLoading(false);
        return;
      }

      setSeekerState(profile.state);
    }

    loadProfile();
  }, []);

  // ─────────────────────────────────────────────
  // LOAD CATEGORIES
  // ─────────────────────────────────────────────
  useEffect(() => {
    if (!seekerState) return;

    async function loadCategories() {
      setLoading(true);

      const { data, error } = await supabase.rpc("get_categories_nearby", {
        seeker_state: seekerState,
      });

      if (error) {
        alert("Failed to load categories");
        setLoading(false);
        return;
      }

      setCategories(data || []);
      setLoading(false);
    }

    loadCategories();
  }, [seekerState]);

  async function openCategory(category) {
    if (category.providers_count === 0) return;

    setSelectedCategory(category);
    setSelectedSubcategory(null);
    setProviders([]);
    setLoading(true);

    const { data, error } = await supabase.rpc("get_subcategories_nearby", {
      in_category_id: category.category_id,
      seeker_state: seekerState,
    });

    if (error) {
      alert("Failed to load subcategories");
      setLoading(false);
      return;
    }

    setSubcategories(data || []);
    setLoading(false);
  }

  async function openSubcategory(subcat) {
    if (subcat.providers_count === 0) return;

    setSelectedSubcategory(subcat);
    setLoading(true);

    const { data, error } = await supabase.rpc(
      "get_providers_for_subcategory",
      {
        in_subcategory_id: subcat.subcategory_id,
        seeker_state: seekerState,
      }
    );

    if (error) {
      alert("Failed to load providers");
      setLoading(false);
      return;
    }

    setProviders(data || []);
    setLoading(false);
  }

  return (
    <div className="px-6 py-8">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.push("/seeker/dashboard")}
          className="p-2 rounded-lg bg-white shadow border"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold">Find Services</h1>
      </div>

      <div className="mb-6 text-sm text-gray-600">
        Services
        {selectedCategory && ` › ${selectedCategory.category_name}`}
        {selectedSubcategory &&
          ` › ${selectedSubcategory.subcategory_name}`}
      </div>

      {loading && <p className="text-gray-500">Loading...</p>}

      {/* CATEGORIES */}
      {!selectedCategory && !loading && (
        <div className="grid md:grid-cols-2 gap-6">
          {categories.map((c) => (
            <div
              key={c.category_id}
              onClick={() => openCategory(c)}
              className={`bg-white rounded-2xl p-6 shadow border cursor-pointer ${
                c.providers_count === 0
                  ? "opacity-40 cursor-not-allowed"
                  : "hover:shadow-lg"
              }`}
            >
              <h2 className="text-xl font-semibold">
                {c.category_name}
              </h2>
              <p className="text-gray-500 mt-2">
                {c.providers_count} provider
                {c.providers_count !== 1 && "s"} available
              </p>
            </div>
          ))}
        </div>
      )}

      {/* SUBCATEGORIES */}
      {selectedCategory && !selectedSubcategory && !loading && (
        <div className="grid md:grid-cols-2 gap-6">
          {subcategories.map((s) => (
            <div
              key={s.subcategory_id}
              onClick={() => openSubcategory(s)}
              className={`bg-white rounded-2xl p-6 shadow border cursor-pointer ${
                s.providers_count === 0
                  ? "opacity-40 cursor-not-allowed"
                  : "hover:shadow-lg"
              }`}
            >
              <h2 className="text-lg font-semibold">
                {s.subcategory_name}
              </h2>
              <p className="text-gray-500 mt-2">
                {s.providers_count} provider
                {s.providers_count !== 1 && "s"}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* PROVIDERS */}
      {selectedSubcategory && !loading && (
        <div className="grid md:grid-cols-2 gap-6">
          {providers.map((p) => (
            <ProviderDiscoveryCard
              key={p.provider_id}
              providerId={p.provider_id}
              providerName={p.provider_name}
              seekerState={seekerState}
              subcategoryId={selectedSubcategory.subcategory_id}
              subscriptionPlan={p.subscription_plan}
              jobsDone30d={p.jobs_done_30d}
              jobLimit={p.job_limit}
              isAtLimit={p.is_at_limit}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function FindServices() {
  return (
    <RequireRole role="seeker">
      <SeekerLayout>
        <FindServicesContent />
      </SeekerLayout>
    </RequireRole>
  );
}