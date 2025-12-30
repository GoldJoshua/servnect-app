import { useState } from "react";
import RequireAdmin from "../../components/auth/RequireAdmin";
import AdminLayout from "../../components/admin/AdminLayout";

export default function AdminSettings() {
  const [settings, setSettings] = useState({
    maintenanceMode: false,
    allowRegistration: true,
    platformFee: 10,
  });

  function toggle(key) {
    setSettings((s) => ({ ...s, [key]: !s[key] }));
  }

  function updateFee(e) {
    setSettings((s) => ({
      ...s,
      platformFee: Number(e.target.value),
    }));
  }

  return (
    <RequireAdmin>
      <AdminLayout title="Global Settings">
        <h1 className="text-3xl font-bold mb-6 text-[#0b1220]">
          Global Settings
        </h1>

        <div className="bg-white rounded-2xl border p-6 space-y-6 max-w-xl">
          {/* Maintenance */}
          <SettingRow
            label="Maintenance Mode"
            description="Disable platform access for non-admin users"
            checked={settings.maintenanceMode}
            onChange={() => toggle("maintenanceMode")}
          />

          {/* Registration */}
          <SettingRow
            label="Allow New Registrations"
            description="Enable or disable new user signups"
            checked={settings.allowRegistration}
            onChange={() => toggle("allowRegistration")}
          />

          {/* Fee */}
          <div>
            <label className="block font-semibold mb-1">
              Platform Fee (%)
            </label>
            <input
              type="number"
              value={settings.platformFee}
              onChange={updateFee}
              className="w-full border rounded-xl px-4 py-2"
            />
            <p className="text-xs text-gray-500 mt-1">
              Applied to completed jobs (when wallet is enabled)
            </p>
          </div>
        </div>
      </AdminLayout>
    </RequireAdmin>
  );
}

function SettingRow({ label, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="font-semibold">{label}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>

      <button
        onClick={onChange}
        className={`w-12 h-6 rounded-full relative transition ${
          checked ? "bg-gray-500" : "bg-gray-300"
        }`}
      >
        <span
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition ${
            checked ? "right-0.5" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}