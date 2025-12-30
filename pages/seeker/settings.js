// pages/seeker/settings.js
// 🔒 AUTH LOCKED – DO NOT MODIFY AUTH LOGIC

import { useEffect, useState } from "react";
import RequireRole from "../../components/auth/RequireRole";
import SeekerLayout from "../../components/layouts/SeekerLayout";
import { supabase } from "../../lib/supabaseClient";

function SeekerSettingsContent() {
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
    <div className="px-6 py-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-[#0b1220]">Settings</h2>
        <p className="text-sm text-gray-500">
          Manage your account settings and preferences.
        </p>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow border max-w-2xl">
        {/* FULL NAME */}
        <div className="mb-4">
          <label className="text-xs text-gray-500 mb-1 block">Full Name</label>
          <input
            value={fullName}
            disabled
            className="w-full rounded-xl border px-4 py-3 text-sm bg-gray-100"
          />
        </div>

        {/* EMAIL */}
        <div className="mb-4">
          <label className="text-xs text-gray-500 mb-1 block">
            Email Address
          </label>
          <input
            value={email}
            disabled
            className="w-full rounded-xl border px-4 py-3 text-sm bg-gray-100"
          />
        </div>

        {/* PHONE */}
        <div className="mb-4">
          <label className="text-xs text-gray-500 mb-1 block">
            Phone Number
          </label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-xl border px-4 py-3 text-sm"
          />
        </div>

        {/* STATE */}
        <div className="mb-6">
          <label className="text-xs text-gray-500 mb-1 block">State</label>
          <input
            value={state}
            onChange={(e) => setState(e.target.value)}
            className="w-full rounded-xl border px-4 py-3 text-sm"
          />
        </div>

        <div className="flex justify-end">
          {saved && (
            <span className="mr-4 text-sm text-green-600">
              Saved successfully ✓
            </span>
          )}
          <button
            onClick={saveSettings}
            disabled={saving}
            className="px-6 py-3 rounded-xl bg-[#0b1220] text-white text-sm"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SeekerSettings() {
  return (
    <RequireRole role="seeker">
      <SeekerLayout>
        <SeekerSettingsContent />
      </SeekerLayout>
    </RequireRole>
  );
}