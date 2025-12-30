import { useEffect, useMemo, useState } from "react";
import RequireAdmin from "../../components/auth/RequireAdmin";
import AdminLayout from "../../components/admin/AdminLayout";
import { supabase } from "../../lib/supabaseClient";
import {
  BarChart3,
  Users,
  Briefcase,
  MessageSquare,
  Star,
  MapPin,
} from "lucide-react";

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function isoDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.toISOString().slice(0, 10);
}

function lastNDays(n) {
  const days = [];
  const today = startOfDay(new Date());
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    days.push(d);
  }
  return days;
}

function formatDayLabel(iso) {
  // iso = YYYY-MM-DD
  const [y, m, d] = iso.split("-");
  return `${d}/${m}`;
}

function safeNum(v) {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
}

export default function AdminAnalytics() {
  const [loading, setLoading] = useState(true);

  const [profiles, setProfiles] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [messages, setMessages] = useState([]);
  const [ratings, setRatings] = useState([]);

  async function loadAll() {
    setLoading(true);

    const [p, j, m, r] = await Promise.all([
      supabase.from("profiles").select("id, role, created_at, is_banned, rating, review_count"),
      supabase.from("jobs").select("id, service_title, status, created_at, address, budget"),
      supabase.from("messages").select("id, created_at"),
      supabase.from("ratings").select("id, rating, created_at"),
    ]);

    setProfiles(p.data || []);
    setJobs(j.data || []);
    setMessages(m.data || []);
    setRatings(r.data || []);

    setLoading(false);
  }

  useEffect(() => {
    let chProfiles, chJobs, chMessages, chRatings;

    async function init() {
      await loadAll();

      // ✅ REALTIME: refresh analytics on any change
      chProfiles = supabase
        .channel("admin-analytics-profiles")
        .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, loadAll)
        .subscribe();

      chJobs = supabase
        .channel("admin-analytics-jobs")
        .on("postgres_changes", { event: "*", schema: "public", table: "jobs" }, loadAll)
        .subscribe();

      chMessages = supabase
        .channel("admin-analytics-messages")
        .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, loadAll)
        .subscribe();

      chRatings = supabase
        .channel("admin-analytics-ratings")
        .on("postgres_changes", { event: "*", schema: "public", table: "ratings" }, loadAll)
        .subscribe();
    }

    init();

    return () => {
      if (chProfiles) supabase.removeChannel(chProfiles);
      if (chJobs) supabase.removeChannel(chJobs);
      if (chMessages) supabase.removeChannel(chMessages);
      if (chRatings) supabase.removeChannel(chRatings);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const analytics = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const totalUsers = profiles.length;
    const totalProviders = profiles.filter((x) => x.role === "provider").length;
    const totalSeekers = profiles.filter((x) => x.role === "seeker").length;
    const bannedUsers = profiles.filter((x) => x.is_banned).length;

    const activeJobs = jobs.filter((x) => ["pending", "accepted"].includes(x.status)).length;
    const completedJobs = jobs.filter((x) => x.status === "completed").length;

    const newUsers7d = profiles.filter((x) => x.created_at && new Date(x.created_at) >= sevenDaysAgo).length;
    const newJobs7d = jobs.filter((x) => x.created_at && new Date(x.created_at) >= sevenDaysAgo).length;

    // Ratings average (REAL, from ratings table)
    const avgRating =
      ratings.length > 0
        ? (ratings.reduce((sum, x) => sum + safeNum(x.rating), 0) / ratings.length).toFixed(2)
        : "0.00";

    // Jobs per day (last 14 days)
    const days = lastNDays(14).map((d) => isoDay(d));
    const jobsByDay = days.map((d) => ({ day: d, count: 0 }));
    const msgsByDay = days.map((d) => ({ day: d, count: 0 }));

    for (const j of jobs) {
      if (!j.created_at) continue;
      const k = isoDay(j.created_at);
      const idx = jobsByDay.findIndex((x) => x.day === k);
      if (idx >= 0) jobsByDay[idx].count += 1;
    }

    for (const m of messages) {
      if (!m.created_at) continue;
      const k = isoDay(m.created_at);
      const idx = msgsByDay.findIndex((x) => x.day === k);
      if (idx >= 0) msgsByDay[idx].count += 1;
    }

    // Top services (REAL from jobs.service_title)
    const serviceMap = new Map();
    for (const j of jobs) {
      const key = (j.service_title || "Unknown").trim();
      serviceMap.set(key, (serviceMap.get(key) || 0) + 1);
    }
    const topServices = Array.from(serviceMap.entries())
      .map(([service, count]) => ({ service, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // Geo distribution (BEST-EFFORT REAL from jobs.address)
    // We extract last comma-part as "area/state" (e.g. "Lekki", "Lagos")
    const geoMap = new Map();
    for (const j of jobs) {
      const addr = (j.address || "").trim();
      let geo = "Unknown";
      if (addr.includes(",")) {
        geo = addr.split(",").map((s) => s.trim()).filter(Boolean).slice(-1)[0] || "Unknown";
      } else if (addr.length > 0) {
        geo = addr; // fallback: whole address if no commas
      }
      geoMap.set(geo, (geoMap.get(geo) || 0) + 1);
    }
    const geoTop = Array.from(geoMap.entries())
      .map(([location, count]) => ({ location, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const maxJobsDay = Math.max(1, ...jobsByDay.map((x) => x.count));
    const maxMsgsDay = Math.max(1, ...msgsByDay.map((x) => x.count));
    const maxService = Math.max(1, ...topServices.map((x) => x.count));
    const maxGeo = Math.max(1, ...geoTop.map((x) => x.count));

    return {
      totals: {
        totalUsers,
        totalProviders,
        totalSeekers,
        bannedUsers,
        activeJobs,
        completedJobs,
        newUsers7d,
        newJobs7d,
        avgRating,
        totalMessages: messages.length,
        totalRatings: ratings.length,
      },
      jobsByDay,
      msgsByDay,
      topServices,
      geoTop,
      maxJobsDay,
      maxMsgsDay,
      maxService,
      maxGeo,
    };
  }, [profiles, jobs, messages, ratings]);

  return (
    <RequireAdmin>
      <AdminLayout title="Platform Analytics">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-[#0b1220]">Platform Analytics</h1>
            <p className="text-sm text-gray-500 mt-1">
              Real-time insights based on your current database (jobs, profiles, messages, ratings).
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadAll}
              className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-sm font-semibold"
            >
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-gray-500">Loading analytics…</div>
        ) : (
          <>
            {/* KPI CARDS (NO FAKE %) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <KpiCard
                title="Total Users"
                value={analytics.totals.totalUsers}
                icon={Users}
                sub={`${analytics.totals.totalProviders} providers • ${analytics.totals.totalSeekers} seekers`}
              />
              <KpiCard
                title="Jobs"
                value={jobs.length}
                icon={Briefcase}
                sub={`${analytics.totals.activeJobs} active • ${analytics.totals.completedJobs} completed`}
              />
              <KpiCard
                title="Messages"
                value={analytics.totals.totalMessages}
                icon={MessageSquare}
                sub="Realtime job chat volume"
              />
              <KpiCard
                title="Average Rating"
                value={`⭐ ${analytics.totals.avgRating}`}
                icon={Star}
                sub={`${analytics.totals.totalRatings} total ratings`}
              />
            </div>

            {/* CHARTS ROW */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
              {/* Jobs Trend */}
              <Panel title="Jobs Created (Last 14 Days)" icon={BarChart3}>
                <BarStrip
                  data={analytics.jobsByDay}
                  max={analytics.maxJobsDay}
                  labelKey="day"
                  valueKey="count"
                  formatLabel={(d) => formatDayLabel(d)}
                />
              </Panel>

              {/* Messages Trend */}
              <Panel title="Messages Sent (Last 14 Days)" icon={MessageSquare}>
                <BarStrip
                  data={analytics.msgsByDay}
                  max={analytics.maxMsgsDay}
                  labelKey="day"
                  valueKey="count"
                  formatLabel={(d) => formatDayLabel(d)}
                />
              </Panel>

              {/* Quick health-ish */}
              <Panel title="User Growth (Last 7 Days)" icon={Users}>
                <div className="space-y-3">
                  <MetricRow label="New Users" value={analytics.totals.newUsers7d} />
                  <MetricRow label="New Jobs" value={analytics.totals.newJobs7d} />
                  <MetricRow label="Banned Users" value={analytics.totals.bannedUsers} />
                  <div className="text-xs text-gray-400 pt-2">
                    (Traffic sources require tracking events — we’ll add that when you’re ready.)
                  </div>
                </div>
              </Panel>
            </div>

            {/* TOP SERVICES + GEO */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              <Panel title="Top Services (Real from Jobs)" icon={Briefcase}>
                {analytics.topServices.length === 0 ? (
                  <div className="text-sm text-gray-500">No jobs yet.</div>
                ) : (
                  <RankBars
                    rows={analytics.topServices.map((x) => ({
                      label: x.service,
                      value: x.count,
                    }))}
                    max={analytics.maxService}
                  />
                )}
              </Panel>

              <Panel title="Geographic Distribution (Best-effort from Address)" icon={MapPin}>
                {analytics.geoTop.length === 0 ? (
                  <div className="text-sm text-gray-500">No addresses yet.</div>
                ) : (
                  <RankBars
                    rows={analytics.geoTop.map((x) => ({
                      label: x.location,
                      value: x.count,
                    }))}
                    max={analytics.maxGeo}
                  />
                )}
                <div className="text-xs text-gray-400 mt-3">
                  Tip: If you want perfect geo charts, store `state` / `lga` as separate columns on jobs.
                </div>
              </Panel>
            </div>
          </>
        )}
      </AdminLayout>
    </RequireAdmin>
  );
}

/* ----------------------------- UI COMPONENTS ----------------------------- */

function Panel({ title, icon: Icon, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-2xl bg-[#3b5bfd]/10 flex items-center justify-center">
            <Icon size={18} className="text-[#3b5bfd]" />
          </div>
          <div className="text-lg font-bold text-[#0b1220]">{title}</div>
        </div>
      </div>
      {children}
    </div>
  );
}

function KpiCard({ title, value, sub, icon: Icon }) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="w-12 h-12 rounded-2xl bg-[#0b1220]/5 flex items-center justify-center">
          <Icon size={20} className="text-[#0b1220]" />
        </div>
      </div>

      <div className="mt-4 text-sm text-gray-500">{title}</div>
      <div className="mt-2 text-3xl font-extrabold text-[#0b1220]">{value}</div>
      <div className="mt-2 text-xs text-gray-400">{sub}</div>
    </div>
  );
}

function MetricRow({ label, value }) {
  return (
    <div className="flex items-center justify-between bg-[#f4f6fb] border border-gray-200 rounded-xl px-4 py-3">
      <div className="text-sm text-gray-600">{label}</div>
      <div className="text-sm font-bold text-[#0b1220]">{value}</div>
    </div>
  );
}

function BarStrip({ data, max, labelKey, valueKey, formatLabel }) {
  return (
    <div className="h-[260px] rounded-2xl bg-[#f4f6fb] border border-gray-200 flex items-end p-4 gap-2">
      {data.map((row) => {
        const rawLabel = row[labelKey];
        const label = formatLabel ? formatLabel(rawLabel) : rawLabel;
        const v = safeNum(row[valueKey]);
        const pct = Math.round((v / max) * 100);

        return (
          <div key={rawLabel} className="flex-1 flex flex-col items-center gap-2">
            <div className="w-full rounded-xl bg-[#3b5bfd]/20 overflow-hidden flex items-end" style={{ height: "210px" }}>
              <div
                className="w-full bg-[#3b5bfd]"
                style={{ height: `${Math.max(0, pct)}%` }}
                title={`${label}: ${v}`}
              />
            </div>
            <div className="text-[10px] text-gray-500">{label}</div>
          </div>
        );
      })}
    </div>
  );
}

function RankBars({ rows, max }) {
  return (
    <div className="space-y-3">
      {rows.map((r) => {
        const pct = Math.round((safeNum(r.value) / max) * 100);
        return (
          <div key={r.label} className="flex items-center gap-3">
            <div className="w-36 text-xs text-gray-600 truncate" title={r.label}>
              {r.label}
            </div>

            <div className="flex-1 h-3 rounded-full bg-[#f4f6fb] border border-gray-200 overflow-hidden">
              <div className="h-full bg-[#3b5bfd]" style={{ width: `${pct}%` }} />
            </div>

            <div className="w-10 text-right text-xs font-semibold text-[#0b1220]">
              {r.value}
            </div>
          </div>
        );
      })}
    </div>
  );
}