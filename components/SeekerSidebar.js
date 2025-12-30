// components/SeekerSidebar.js
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  LayoutDashboard,
  Search,
  MessageCircle,
  Wallet,
  HelpCircle,
  Settings,
  LogOut,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";

export default function SeekerSidebar() {
  const router = useRouter();
  const [userName, setUserName] = useState("User");
  const [role, setRole] = useState("SEEKER");

  useEffect(() => {
    async function loadUser() {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("name, role")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Sidebar profile error:", error);
        return;
      }

      if (profile?.name) {
        setUserName(profile.name.split(" ")[0]);
      }

      if (profile?.role) {
        setRole(profile.role.toUpperCase());
      }
    }

    loadUser();
  }, [router]);

  const menuItems = [
    { label: "Dashboard", icon: <LayoutDashboard size={18} />, href: "/seeker/dashboard" },
    { label: "Find Services", icon: <Search size={18} />, href: "/seeker/find" },
    { label: "Messages / Live Chat", icon: <MessageCircle size={18} />, href: "/seeker/messages" },
    { label: "Wallet", icon: <Wallet size={18} />, href: "/seeker/wallet" },
    { label: "Support", icon: <HelpCircle size={18} />, href: "/seeker/support" },
    { label: "Settings", icon: <Settings size={18} />, href: "/seeker/settings" },
  ];

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <aside className="flex flex-col w-64 bg-gradient-to-b from-[#050816] to-[#111827] text-white border-r border-white/10 h-screen">
      {/* LOGO */}
      <div className="px-6 py-5 border-b border-white/10 flex items-center gap-3">
        <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-cyan-400 to-purple-500 shadow-lg flex items-center justify-center">
          <img
            src="/serviceconnect-logo.svg"
            alt="ServiceConnect"
            className="h-7 w-7"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
          <span className="text-xs font-bold">SC</span>
        </div>
        <div>
          <div className="text-sm font-semibold">ServiceConnect</div>
          <div className="text-[11px] text-white/60">Client Portal</div>
        </div>
      </div>

      {/* MENU */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {menuItems.map((item) => {
          const active = router.pathname === item.href;
          return (
            <button
              key={item.label}
              onClick={() => router.push(item.href)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition
                ${active ? "bg-white text-[#0b1220]" : "text-gray-300 hover:bg-white/10"}`}
            >
              <span
                className={`h-8 w-8 rounded-xl flex items-center justify-center ${
                  active ? "bg-[#0b1220] text-white" : "bg-white/5"
                }`}
              >
                {item.icon}
              </span>
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* FOOTER */}
      <div className="px-4 py-4 border-t border-white/10">
        <div className="text-[11px] text-white/60 mb-2">
          Logged in as{" "}
          <span className="font-semibold text-white">{userName}</span> · {role}
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-gray-500/10 text-xs"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </aside>
  );
}