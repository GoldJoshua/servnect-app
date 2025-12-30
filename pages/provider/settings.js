// pages/provider/settings.js
// 🔒 AUTH LOCKED – DO NOT MODIFY
// This page is protected by RequireRole (provider only).
// UI changes are allowed. Auth logic must stay in RequireRole.

import { useEffect, useState } from "react";
import RequireRole from "../../components/auth/RequireRole";
import { supabase } from "../../lib/supabaseClient";

import ProviderLayout from "../../components/layouts/ProviderLayout";
import ProviderHeader from "../../components/provider/ProviderHeader";

function ProviderSettingsContent() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [state, setState] = useState("");

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, email, phone, state")
        .eq("id", user.id)
        .single();

      if (profile) {
        setFullName(profile.full_name || "");
        setEmail(profile.email || "");
        setPhone(profile.phone || "");
        setState(profile.state || "");
      }
    }

    loadProfile();
  }, []);

  async function saveSettings() {
    setSaving(true);
    setSaved(false);

    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user) return;

    await supabase
      .from("profiles")
      .update({
        phone,
        state,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    setSaving(false);
    setSaved(true);
  }

  return (
    <ProviderLayout>
      <div className="min-h-screen bg-[#eef1f6]">
        <main className="flex-1 px-6 py-6">
          <ProviderHeader name={fullName || "Provider"} />

          <div className="mb-6">
            <h2 className="text-xl font-bold text-[#0b1220]">Settings</h2>
            <p className="text-sm text-gray-500">
              Manage your profile and account preferences.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow border max-w-2xl">
            {/* FULL NAME (LOCKED) */}
            <div className="mb-4">
              <label className="text-xs text-gray-500 mb-1 block">
                Full Name
              </label>
              <input
                value={fullName}
                disabled
                className="w-full rounded-xl border px-4 py-3 text-sm
                           bg-gray-100 text-gray-600 cursor-not-allowed"
              />
            </div>

            {/* EMAIL (LOCKED) */}
            <div className="mb-4">
              <label className="text-xs text-gray-500 mb-1 block">
                Email Address
              </label>
              <input
                value={email}
                disabled
                className="w-full rounded-xl border px-4 py-3 text-sm
                           bg-gray-100 text-gray-600 cursor-not-allowed"
              />
              <p className="text-xs text-gray-400 mt-1">
                To change your name or email, please contact support.
              </p>
            </div>

            {/* PHONE */}
            <div className="mb-4">
              <label className="text-xs text-gray-500 mb-1 block">
                Phone Number
              </label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border px-4 py-3 text-sm
                           focus:outline-none focus:ring-2 focus:ring-[#0b1220]"
              />
            </div>

            {/* STATE */}
            <div className="mb-6">
              <label className="text-xs text-gray-500 mb-1 block">
                State
              </label>
              <input
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full rounded-xl border px-4 py-3 text-sm
                           focus:outline-none focus:ring-2 focus:ring-[#0b1220]"
              />
            </div>

            <div className="flex items-center justify-between">
              {saved && (
                <span className="text-sm text-gray-600 font-medium">
                  Settings saved successfully ✓
                </span>
              )}

              <button
                onClick={saveSettings}
                disabled={saving}
                className={`ml-auto px-6 py-3 rounded-xl text-sm font-semibold text-white ${
                  saving
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-[#0b1220]"
                }`}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </main>
      </div>
    </ProviderLayout>
  );
}

export default function ProviderSettings() {
  return (
    <RequireRole role="provider">
      <ProviderSettingsContent />
    </RequireRole>
  );
}