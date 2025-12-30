import { useEffect, useMemo, useState } from "react";
import RequireAdmin from "../../components/auth/RequireAdmin";
import AdminLayout from "../../components/admin/AdminLayout";
import { supabase } from "../../lib/supabaseClient";
import { Users, DollarSign, Briefcase, AlertTriangle } from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRevenue: null, // real when transactions exist
    activeJobs: 0,
    pendingDisputes: null, // real when disputes exist
  });

  const [activity, setActivity] = useState([]);

  /* -------------------------------
   * LOAD STATS (REAL DATA ONLY)
   * ------------------------------- */
  async function loadStats() {
    const [users, activeJobs] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase
        .from("jobs")
        .select("id", { count: "exact", head: true })
        .in("status", ["pending", "accepted"]),
    ]);

    setStats({
      totalUsers: users.count || 0,
      activeJobs: activeJobs.count || 0,
      totalRevenue: null,
      pendingDisputes: null,
    });
  }

  /* -------------------------------
   * RECENT ACTIVITY (REAL JOBS)
   * ------------------------------- */
  async function loadActivity() {
    const { data } = await supabase
      .from("jobs")
      .select("id, service_title, status, created_at")
      .order("created_at", { ascending: false })
      .limit(5);

    const items =
      data?.map((j) => ({
        id: j.id,
        text:
          j.status === "pending"
            ? `New job created: ${j.service_title || "Service"}`
            : j.status === "accepted"
            ? `Job accepted: ${j.service_title || "Service"}`
            : `Job updated: ${j.service_title || "Service"}`,
        time: new Date(j.created_at).toLocaleString(),
      })) || [];

    setActivity(items);
  }

  /* -------------------------------
   * REALTIME SUBSCRIPTIONS
   * ------------------------------- */
  useEffect(() => {
    let profilesCh;
    let jobsCh;

    async function init() {
      await loadStats();
      await loadActivity();

      profilesCh = supabase
        .channel("admin-profiles-realtime")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "profiles" },
          loadStats
        )
        .subscribe();

      jobsCh = supabase
        .channel("admin-jobs-realtime")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "jobs" },
          async () => {
            await loadStats();
            await loadActivity();
          }
        )
        .subscribe();
    }

    init();

    return () => {
      if (profilesCh) supabase.removeChannel(profilesCh);
      if (jobsCh) supabase.removeChannel(jobsCh);
    };
  }, []);

  /* -------------------------------
   * DASHBOARD CARDS (NO FAKE DATA)
   * ------------------------------- */
  const cards = useMemo(
    () => [
      {
        title: "Total Users",
        value: stats.totalUsers,
        icon: Users,
        iconBg: "bg-[#3b5bfd]/10",
        iconColor: "text-[#3b5bfd]",
      },
      {
        title: "Total Revenue",
        value: stats.totalRevenue ? `₦${stats.totalRevenue}` : "—",
        icon: DollarSign,
        iconBg: "bg-gray-500/10",
        iconColor: "text-gray-600",
      },
      {
        title: "Active Jobs",
        value: stats.activeJobs,
        icon: Briefcase,
        iconBg: "bg-purple-500/10",
        iconColor: "text-purple-600",
      },
      {
        title: "Pending Disputes",
        value: stats.pendingDisputes ?? "—",
        icon: AlertTriangle,
        iconBg: "bg-orange-500/10",
        iconColor: "text-orange-600",
      },
    ],
    [stats]
  );

  return (
    <RequireAdmin>
      <AdminLayout title="System Overview">
        {/* HEADER */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-[#0b1220]">
              System Overview
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Real-time platform metrics and insights.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button className="px-4 py-2 rounded-xl bg-white border text-sm font-semibold">
              Download Report
            </button>
            <button className="px-4 py-2 rounded-xl bg-[#3b5bfd] text-white text-sm font-semibold shadow">
              Live View
            </button>
          </div>
        </div>

        {/* STAT CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {cards.map((c) => {
            const Icon = c.icon;
            return (
              <div
                key={c.title}
                className="bg-white rounded-2xl p-6 border shadow-sm"
              >
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center ${c.iconBg}`}
                >
                  <Icon size={20} className={c.iconColor} />
                </div>

                <div className="mt-4 text-sm text-gray-500">{c.title}</div>
                <div className="mt-2 text-3xl font-extrabold text-[#0b1220]">
                  {c.value}
                </div>
              </div>
            );
          })}
        </div>

        {/* CHART + ACTIVITY */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* CHART */}
          <div className="lg:col-span-2 bg-white rounded-2xl border shadow-sm p-6">
            <div className="flex justify-between mb-4">
              <div className="text-lg font-bold">Revenue Growth</div>
              <div className="text-sm text-gray-500">Last 7 Days</div>
            </div>

            <div className="h-[260px] rounded-2xl bg-[#f4f6fb] border flex items-end p-4 gap-3">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-xl bg-[#3b5bfd]/20 overflow-hidden"
                  style={{ height: `${40 + (i % 6) * 25}px` }}
                >
                  <div
                    className="w-full bg-[#3b5bfd]"
                    style={{ height: `${20 + (i % 6) * 15}px` }}
                  />
                </div>
              ))}
            </div>

            <p className="mt-3 text-xs text-gray-400">
              Revenue chart activates when transactions are enabled.
            </p>
          </div>

          {/* ACTIVITY */}
          <div className="bg-white rounded-2xl border shadow-sm p-6">
            <div className="text-lg font-bold mb-4">Recent Activity</div>

            <div className="space-y-4">
              {activity.length === 0 ? (
                <div className="text-sm text-gray-500">No activity yet.</div>
              ) : (
                activity.map((a, idx) => (
                  <div key={a.id} className="flex gap-3">
                    <span
                      className={`mt-2 w-2 h-2 rounded-full ${
                        idx % 2 === 0 ? "bg-gray-500" : "bg-gray-500"
                      }`}
                    />
                    <div>
                      <div className="text-sm font-medium">{a.text}</div>
                      <div className="text-xs text-gray-400">{a.time}</div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <button className="mt-6 w-full text-sm font-semibold text-[#3b5bfd] hover:underline">
              View All Logs ↗
            </button>
          </div>
        </div>
      </AdminLayout>
    </RequireAdmin>
  );
}