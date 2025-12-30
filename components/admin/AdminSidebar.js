// 🔒 AUTH LOCKED – DO NOT MODIFY AUTH LOGIC
// Admin Sidebar – Persistent navigation for Admin Dashboard

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Star,
  LifeBuoy,
  Activity,
  Settings,
  LogOut,
  DollarSign,
  Share2, // ✅ ADDED
} from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

export default function AdminSidebar() {
  const router = useRouter();
  const [adminName, setAdminName] = useState("Admin");

  useEffect(() => {
    async function loadAdmin() {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth?.user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", auth.user.id)
        .single();

      if (profile?.name) {
        setAdminName(profile.name);
      } else {
        setAdminName(auth.user.email);
      }
    }

    loadAdmin();
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  // ✅ ADMIN NAVIGATION
  const menu = [
    { label: "System Overview", icon: LayoutDashboard, path: "/admin" },
    { label: "User Management", icon: Users, path: "/admin/users" },
    { label: "Jobs", icon: Briefcase, path: "/admin/jobs" },

    // 🧩 REFERRALS — FIELD AGENTS
    { label: "Field Agent Referrals", icon: Share2, path: "/admin/referrals" },

    // 💸 FINANCE
    { label: "Withdrawals", icon: DollarSign, path: "/admin/withdrawals" },

    { label: "Ratings", icon: Star, path: "/admin/ratings" },
    { label: "Support", icon: LifeBuoy, path: "/admin/support" },
    { label: "System Health", icon: Activity, path: "/admin/health" },
    { label: "Global Settings", icon: Settings, path: "/admin/settings" },
  ];

  return (
    <aside className="w-72 min-h-screen bg-[#0B1220] text-white flex flex-col">
      {/* BRAND */}
      <div className="px-6 py-6 border-b border-white/10">
        <div className="text-xl font-extrabold">ServiceConnect</div>
        <div className="text-xs text-[#e5e7eb] mt-1 tracking-wide">
          ADMIN PANEL
        </div>
      </div>

      {/* ADMIN INFO */}
      <div className="px-6 py-4 border-b border-white/10">
        <div className="text-sm font-semibold">{adminName}</div>
        <div className="text-xs text-gray-400 mt-1">● System Online</div>
      </div>

      {/* NAV */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {menu.map(({ label, icon: Icon, path }) => {
          const active = router.pathname === path;
          return (
            <button
              key={label}
              onClick={() => router.push(path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition
                ${
                  active
                    ? "bg-white text-[#0B1220]"
                    : "text-white/80 hover:bg-white/10"
                }`}
            >
              <Icon size={18} />
              {label}
            </button>
          );
        })}
      </nav>

      {/* LOGOUT */}
      <div className="p-4">
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2
                     px-4 py-3 rounded-xl bg-gray-600 text-white font-semibold"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </aside>
  );
}