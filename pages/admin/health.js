import { useEffect, useState } from "react";
import RequireAdmin from "../../components/auth/RequireAdmin";
import AdminLayout from "../../components/admin/AdminLayout";
import { supabase } from "../../lib/supabaseClient";
import { Activity, Database, Wifi, AlertTriangle } from "lucide-react";

export default function AdminSystemHealth() {
  const [health, setHealth] = useState({
    database: "checking",
    realtime: "checking",
    auth: "checking",
    lastChecked: null,
    hasIssue: false,
  });

  async function checkHealth() {
    const result = {
      database: "down",
      realtime: "down",
      auth: "down",
      lastChecked: new Date().toLocaleTimeString(),
      hasIssue: false,
    };

    // DATABASE
    const { error: dbError } = await supabase
      .from("profiles")
      .select("id")
      .limit(1);

    if (!dbError) result.database = "up";

    // AUTH
    const { data: auth } = await supabase.auth.getSession();
    if (auth) result.auth = "up";

    // REALTIME
    const channel = supabase.channel("health-check");
    const status = await channel.subscribe();
    if (status === "SUBSCRIBED") result.realtime = "up";
    supabase.removeChannel(channel);

    // ISSUE DETECTION
    if (
      result.database === "down" ||
      result.realtime === "down" ||
      result.auth === "down"
    ) {
      result.hasIssue = true;

      // 🔔 Browser alert (once permission granted)
      if (Notification.permission === "granted") {
        new Notification("⚠️ System Health Alert", {
          body: "One or more system services are DOWN.",
        });
      }
    }

    setHealth(result);
  }

  useEffect(() => {
    if (Notification.permission !== "granted") {
      Notification.requestPermission();
    }

    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <RequireAdmin>
      <AdminLayout title="System Health">
        {health.hasIssue && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border bg-white px-6 py-4 text-gray-700">
            <AlertTriangle />
            <span className="font-semibold">
              System issue detected. Immediate attention required.
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <HealthCard title="Database" icon={Database} status={health.database} />
          <HealthCard title="Realtime Engine" icon={Activity} status={health.realtime} />
          <HealthCard title="Authentication" icon={Wifi} status={health.auth} />
        </div>

        <p className="mt-6 text-sm text-gray-500">
          Last checked: {health.lastChecked || "—"}
        </p>
      </AdminLayout>
    </RequireAdmin>
  );
}

function HealthCard({ title, icon: Icon, status }) {
  return (
    <div className="bg-white border rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Icon size={22} />
          <h3 className="font-semibold">{title}</h3>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            status === "up"
              ? "bg-gray-100 text-gray-800"
              : "bg-gray-200 text-gray-900"
          }`}
        >
          {status.toUpperCase()}
        </span>
      </div>
    </div>
  );
}