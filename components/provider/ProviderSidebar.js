// 🔒 AUTH LOCKED – DO NOT MODIFY AUTH LOGIC
// This file controls PROVIDER dashboard navigation UI only.
// Safe for UI edits. Do NOT add auth or role logic here.

import { useRouter } from "next/router";
import {
  Home,
  Briefcase,
  MessageSquare,
  CreditCard,
  LifeBuoy,
  Settings,
  LogOut,
  Crown,
  Share2,
} from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

export default function ProviderSidebar({
  userName = "Provider",
  activationPaid = true, // ✅ ADDED (default true, non-breaking)
}) {
  const router = useRouter();

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  const menu = [
    { label: "Dashboard", icon: Home, path: "/provider/dashboard" },
    { label: "Job Requests", icon: Briefcase, path: "/provider/jobs" },
    { label: "Messages / Live Chat", icon: MessageSquare, path: "/provider/messages" },
    { label: "Referrals", icon: Share2, path: "/provider/referrals" }, // ✅ ADDED
    { label: "Wallet", icon: CreditCard, path: "/provider/wallet" },
    { label: "Subscription", icon: Crown, path: "/provider/subscription" },
    { label: "Support", icon: LifeBuoy, path: "/provider/support" },
    { label: "Settings", icon: Settings, path: "/provider/settings" },
  ];

  return (
    <aside
      className="hidden lg:flex flex-col w-72 min-h-screen
                 bg-gradient-to-b from-[#0b1220] via-[#0e1627] to-[#0b1220]
                 text-white shadow-[18px_0_50px_rgba(0,0,0,0.45)]"
    >
      {/* BRAND */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-white/10">
        <div
          className="h-10 w-10 rounded-xl flex items-center justify-center
                     bg-[#111827] border border-white/10
                     text-white font-extrabold text-sm"
        >
          SC
        </div>

        <div>
          <div className="text-lg font-bold leading-tight">ServiceConnect</div>
          <div className="text-[11px] text-white/50 font-medium">
            Provider Dashboard
          </div>
        </div>
      </div>

      {/* CURRENT PLAN */}
      <div className="px-6 pt-4 pb-2">
        <div
          className="flex items-center justify-between text-xs rounded-lg
                     bg-white/5 px-3 py-2 border border-white/10"
        >
          <span className="text-white/60">Current Plan</span>
          <span className="font-semibold text-white">Free</span>
        </div>
      </div>

      {/* MENU */}
      <nav className="flex-1 px-3 py-6 space-y-1">
        {menu.map(({ label, icon: Icon, path }) => {
          const active = router.pathname.startsWith(path);
          const locked = !activationPaid && label !== "Dashboard";

          return (
            <button
              key={label}
              onClick={() => !locked && router.push(path)}
              disabled={locked}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
                transition-all duration-200
                ${
                  locked
                    ? "text-white/30 cursor-not-allowed"
                    : active
                    ? "bg-white/10 text-white shadow-inner"
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                }`}
            >
              <Icon size={18} />
              {label}
            </button>
          );
        })}
      </nav>

      {/* FOOTER */}
      <div className="px-4 py-5 border-t border-white/10">
        <div className="mb-4 text-xs text-white/50">
          Signed in as{" "}
          <span className="text-white font-semibold">{userName}</span>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2
                     px-4 py-3 rounded-xl text-sm font-semibold
                     bg-white/5 hover:bg-white/10
                     text-white/80 hover:text-white
                     border border-white/10 transition"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </aside>
  );
}