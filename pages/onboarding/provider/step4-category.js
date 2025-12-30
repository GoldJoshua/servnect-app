// pages/onboarding/provider/step4-category.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, X, Search } from "lucide-react";
import { supabase } from "../../../lib/supabaseClient";

export default function ProviderOnboardingStep4Category() {
  const router = useRouter();

  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);

  const [categoryId, setCategoryId] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ✅ Real-time, case-insensitive GLOBAL search
  const [searchTerm, setSearchTerm] = useState("");

  // ✅ Add new role popup
  const [showAddRole, setShowAddRole] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [requestingRole, setRequestingRole] = useState(false);
  const [roleRequested, setRoleRequested] = useState(false);

  // ─────────────────────────────────────────────
  // LOAD CATEGORIES & SUBCATEGORIES (UNCHANGED)
  // ─────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      const { data: cats } = await supabase
        .from("service_categories")
        .select("id, name")
        .eq("is_active", true)
        .order("sort_order");

      const { data: subs } = await supabase
        .from("service_subcategories")
        .select("id, name, category_id")
        .eq("is_active", true)
        .order("sort_order");

      setCategories(cats || []);
      setSubcategories(subs || []);
      setLoading(false);
    }

    load();
  }, []);

  function goBack() {
    router.push("/onboarding/provider/step3-address");
  }

  function openAddRolePopup(prefill = "") {
    setNewRoleName(prefill || "");
    setShowAddRole(true);
  }

  function closeAddRolePopup() {
    if (requestingRole) return;
    setShowAddRole(false);
  }

  function normalizeRoleName(name) {
    return (name || "").trim().replace(/\s+/g, " ");
  }

  function selectFromSearch(sub) {
    setCategoryId(sub.category_id);
    setSubcategoryId(sub.id);
    setSearchTerm("");
    setRoleRequested(false);
  }

  // ─────────────────────────────────────────────
  // SUBMIT NEW ROLE REQUEST (PENDING ADMIN APPROVAL)
  // ─────────────────────────────────────────────
  async function submitNewRoleRequest() {
    if (requestingRole) return;

    const roleName = normalizeRoleName(newRoleName);
    if (!roleName) return;

    if (!categoryId) {
      alert("Please select a category first.");
      return;
    }

    setRequestingRole(true);

    // 🔑 AUTH USER MUST EXIST
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;

    if (!user) {
      router.replace("/login");
      return;
    }

    // ✅ Prevent duplicate requests from same user for same category + role
    const { data: existingReq } = await supabase
      .from("provider_role_requests")
      .select("id")
      .eq("provider_id", user.id)
      .eq("category_id", categoryId)
      .ilike("role_name", roleName) // case-insensitive match
      .maybeSingle();

    if (!existingReq) {
      const { error } = await supabase.from("provider_role_requests").insert({
        provider_id: user.id,
        category_id: categoryId,
        role_name: roleName,
        status: "pending",
      });

      if (error) {
        // If unique index blocks duplicates, we still treat as OK for UX
        alert("Failed to submit role request. Please try again.");
        setRequestingRole(false);
        return;
      }
    }

    // ✅ Allow provider to continue signup even if role is pending approval
    setRoleRequested(true);
    setSubcategoryId(""); // ensure they don't accidentally submit wrong subcategory
    setSearchTerm("");
    setShowAddRole(false);
    setRequestingRole(false);

    alert(
      "Your role request has been submitted for admin approval. You can continue your signup."
    );
  }

  // ─────────────────────────────────────────────
  // SAVE PROVIDER SERVICE TO DATABASE
  // ─────────────────────────────────────────────
  async function next() {
    if (!categoryId || saving) return;

    // ✅ Allow Next if:
    // - they selected a subcategory (existing flow), OR
    // - they submitted a new role request (pending admin approval)
    if (!subcategoryId && !roleRequested) return;

    setSaving(true);

    // 🔑 AUTH USER MUST EXIST
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;

    if (!user) {
      router.replace("/login");
      return;
    }

    // ✅ Existing flow: save provider service if they selected a subcategory
    if (subcategoryId) {
      // ✅ Prevent duplicate service rows (UNCHANGED LOGIC)
      const { data: existing } = await supabase
        .from("provider_services")
        .select("id")
        .eq("provider_id", user.id)
        .eq("subcategory_id", subcategoryId)
        .maybeSingle();

      if (!existing) {
        const { error } = await supabase.from("provider_services").insert({
          provider_id: user.id,
          subcategory_id: subcategoryId,
        });

        if (error) {
          alert("Failed to save service. Please try again.");
          setSaving(false);
          return;
        }
      }
    }

    setSaving(false);
    router.push("/onboarding/provider/step5-experience");
  }

  // Category-limited list (unchanged behavior for dropdown)
  const filteredSubs = subcategories.filter((s) => s.category_id === categoryId);

  // ✅ GLOBAL results for the search dropdown
  const globalResults =
    searchTerm.trim().length === 0
      ? []
      : subcategories.filter((s) =>
          (s.name || "")
            .toLowerCase()
            .includes(searchTerm.trim().toLowerCase())
        );

  const noGlobalResults =
    searchTerm.trim().length > 0 && globalResults.length === 0;

  return (
    <div className="min-h-screen flex bg-[#eef1f6]">
      {/* LEFT BRAND PANEL */}
      <div
        className="hidden lg:flex w-1/2 bg-gradient-to-br from-[#f8fafc] to-[#edf2f7] 
        p-12 items-center justify-center relative overflow-hidden"
      >
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
            <p className="mt-3 text-gray-600">Select the service you provide.</p>
          </div>
        </div>
      </div>

      {/* RIGHT FORM */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.995 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="w-full max-w-lg"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6 px-2">
            <button
              onClick={goBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 p-2 rounded-lg
              bg-white shadow-sm border border-white/60"
            >
              <ArrowLeft size={18} />
              <span className="text-sm">Back</span>
            </button>
            <div className="text-sm text-gray-500">Step 4 of 7</div>
          </div>

          {/* Progress */}
          <div className="relative h-3 rounded-full bg-[#f0f3f7] mb-8 shadow-inner border border-white/40">
            <motion.div
              initial={{ width: "48%" }}
              animate={{ width: "64%" }}
              transition={{ duration: 0.6 }}
              className="absolute left-0 top-0 h-full rounded-full 
                bg-gradient-to-r from-[#2b3140] to-[#3b485f]"
            />
          </div>

          {/* Card */}
          <div className="bg-[#f8fbff] rounded-2xl p-10 shadow border border-white/60">
            <h1 className="text-3xl font-bold text-[#07102a]">
              Service Category
            </h1>
            <p className="mt-2 text-gray-500">Choose what service you offer.</p>

            {/* Category */}
            <div className="mt-6">
              <label className="block text-xs text-gray-500 mb-2">
                Category
              </label>
              <select
                value={categoryId}
                disabled={loading}
                onChange={(e) => {
                  setCategoryId(e.target.value);
                  setSubcategoryId("");
                  setRoleRequested(false);
                }}
                className="w-full rounded-xl bg-white p-4 border border-gray-100"
              >
                <option value="">
                  {loading ? "Loading..." : "Select Category"}
                </option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* ✅ GLOBAL SEARCH (always visible) */}
            <div className="mt-6">
              <label className="block text-xs text-gray-500 mb-2">
                Search roles
              </label>

              <div className="relative">
                <div
                  className="w-full rounded-2xl bg-white border border-gray-100 shadow-sm
                    flex items-center gap-3 px-4 py-3"
                >
                  <Search size={18} className="text-gray-400" />
                  <input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search all roles (e.g. architect, baker, electrician)..."
                    className="w-full bg-transparent outline-none text-sm text-gray-700 placeholder:text-gray-400"
                  />
                </div>

                {/* Results dropdown */}
                {searchTerm.trim().length > 0 && (
                  <div className="absolute z-20 mt-2 w-full rounded-2xl bg-white border border-gray-100 shadow-lg overflow-hidden">
                    {globalResults.length > 0 ? (
                      <div className="max-h-60 overflow-auto">
                        {globalResults.slice(0, 30).map((s) => (
                          <button
                            type="button"
                            key={s.id}
                            onClick={() => selectFromSearch(s)}
                            className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-[#f3f6fb]"
                          >
                            {s.name}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openAddRolePopup(searchTerm)}
                        className="w-full text-left px-4 py-3 text-sm text-[#0b1220] hover:bg-[#f3f6fb]"
                      >
                        Can't find “{searchTerm}”? Click to add this role
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Pill Add new role button (always visible) */}
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => openAddRolePopup("")}
                  className="w-full rounded-full px-5 py-3 font-medium
                    bg-white border border-gray-100 shadow-sm
                    hover:bg-[#f3f6fb] text-[#0b1220]"
                >
                  Add new role
                </button>
              </div>

              {/* Helpful note when user tries to add from search without category */}
              {noGlobalResults && !categoryId && (
                <div className="mt-3 text-xs text-gray-500">
                  Tip: Select a category so your new role request goes to the right place.
                </div>
              )}
            </div>

            {/* Subcategory */}
            <div className="mt-6">
              <label className="block text-xs text-gray-500 mb-2">
                Subcategory
              </label>
              <select
                value={subcategoryId}
                disabled={!categoryId}
                onChange={(e) => {
                  setSubcategoryId(e.target.value);
                  setRoleRequested(false);
                }}
                className={`w-full rounded-xl bg-white p-4 border border-gray-100 ${
                  !categoryId ? "opacity-70 cursor-not-allowed" : ""
                }`}
              >
                <option value="">
                  {!categoryId ? "Select category first" : "Select Subcategory"}
                </option>
                {filteredSubs.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>

              {roleRequested && (
                <div className="mt-4 text-sm text-gray-600">
                  Your new role request is pending admin approval. You can continue
                  your signup.
                </div>
              )}
            </div>

            <div className="mt-8 flex justify-end">
              <button
                onClick={next}
                disabled={!categoryId || (!subcategoryId && !roleRequested) || saving}
                className={`px-6 py-3 rounded-xl text-white font-medium
                  ${
                    saving
                      ? "bg-gray-300 cursor-not-allowed"
                      : "bg-gradient-to-r from-[#0b1220] to-[#3b485f] shadow-lg"
                  }`}
              >
                {saving ? "Saving..." : "Next"}
              </button>
            </div>
          </div>

          <div className="mt-8 text-center text-xs text-gray-400">
            By continuing, you agree to our Terms and Privacy Policy.
          </div>
        </motion.div>
      </div>

      {/* ✅ Add New Role Popup */}
      <AnimatePresence>
        {showAddRole && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            aria-modal="true"
            role="dialog"
          >
            <div className="absolute inset-0 bg-black/40" onClick={closeAddRolePopup} />
            <motion.div
              initial={{ opacity: 0, y: 18, scale: 0.995 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.995 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="relative w-full max-w-lg bg-[#f8fbff] rounded-2xl p-8 shadow-2xl border border-white/60"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-[#07102a]">Add new role</h3>
                <button
                  type="button"
                  onClick={closeAddRolePopup}
                  className="p-2 rounded-lg bg-white shadow-sm border border-white/60 text-gray-600 hover:text-gray-800"
                  disabled={requestingRole}
                >
                  <X size={18} />
                </button>
              </div>

              <p className="mt-2 text-gray-500 text-sm">
                If your role is not listed, submit it for admin approval. You can
                continue your signup after submitting.
              </p>

              {!categoryId && (
                <div className="mt-4 text-sm text-[#0b1220] bg-white border border-gray-100 rounded-xl p-4">
                  Please select a <b>Category</b> first. Then you can submit a new role.
                </div>
              )}

              <div className="mt-6">
                <label className="block text-xs text-gray-500 mb-2">
                  Role name
                </label>
                <input
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder="Type role name..."
                  className="w-full rounded-xl bg-white p-4 border border-gray-100"
                  disabled={requestingRole}
                />
              </div>

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeAddRolePopup}
                  disabled={requestingRole}
                  className="px-5 py-3 rounded-xl bg-white border border-gray-100 text-gray-700 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={submitNewRoleRequest}
                  disabled={
                    requestingRole || !normalizeRoleName(newRoleName) || !categoryId
                  }
                  className={`px-6 py-3 rounded-xl text-white font-medium
                    ${
                      requestingRole
                        ? "bg-gray-300 cursor-not-allowed"
                        : "bg-gradient-to-r from-[#0b1220] to-[#3b485f] shadow-lg"
                    }`}
                >
                  {requestingRole ? "Submitting..." : "Submit"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}