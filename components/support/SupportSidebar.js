// components/support/SupportSidebar.js
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Ticket,
  BookOpen,
  BarChart3,
} from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

const menu = [
  { label: "Overview", href: "/support", icon: LayoutDashboard },
  { label: "Tickets", href: "/support/tickets", icon: Ticket },
  { label: "Knowledge Base", href: "/support/knowledge-base", icon: BookOpen },
  { label: "Analytics", href: "/support/analytics", icon: BarChart3 },
];

export default function SupportSidebar() {
  const router = useRouter();
  const [email, setEmail] = useState("");

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setEmail(user?.email || "");
    }

    loadUser();
  }, []);

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-gray-200 flex flex-col">
      {/* LOGO */}
      <div className="px-6 py-5 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-black text-white flex items-center justify-center font-bold">
            S
          </div>
          <span className="text-lg font-bold tracking-wide text-black">
            SUPPORT DESK
          </span>
        </div>
      </div>

      {/* MENU */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {menu.map((item) => {
          const active =
            router.pathname === item.href ||
            router.pathname.startsWith(item.href + "/");

          const Icon = item.icon;

          return (
            <Link key={item.href} href={item.href}>
              <div
                className={`flex items-center gap-3 px-4 py-2 rounded-lg cursor-pointer
                ${
                  active
                    ? "bg-black text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Icon size={18} />
                <span className="text-sm font-medium">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* FOOTER USER */}
      <div className="px-4 py-4 border-t border-gray-200">
        <div className="text-sm font-medium text-black">
          {email || "Support"}
        </div>
        <div className="text-xs text-gray-500">Support</div>
      </div>
    </aside>
  );
}