import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import {
  Home,
  Search,
  MessageSquare,
  Wallet,
  MoreHorizontal,
  LifeBuoy,
  Settings,
  LogOut,
} from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

export default function SeekerBottomNav() {
  const router = useRouter();
  const [moreOpen, setMoreOpen] = useState(false);
  const panelRef = useRef(null);

  const main = [
    { label: "Dashboard", icon: Home, path: "/seeker/dashboard" },
    { label: "Find Services", icon: Search, path: "/seeker/find" },
    { label: "Messages", icon: MessageSquare, path: "/seeker/messages" },
    { label: "Wallet", icon: Wallet, path: "/seeker/wallet" },
  ];

  const more = [
    { label: "Support", icon: LifeBuoy, path: "/seeker/support" },
    { label: "Settings", icon: Settings, path: "/seeker/settings" },
  ];

  // Close "More" on outside click
  useEffect(() => {
    function onDocClick(e) {
      if (!panelRef.current) return;
      if (!panelRef.current.contains(e.target)) setMoreOpen(false);
    }
    if (moreOpen) document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [moreOpen]);

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  function isActive(path) {
    // startsWith handles nested routes like /seeker/support/[ticketId]
    return router.pathname === path || router.pathname.startsWith(path + "/");
  }

  return (
    <>
      {/* MORE PANEL */}
      {moreOpen && (
        <div
          ref={panelRef}
          className="
            fixed bottom-24 left-1/2 -translate-x-1/2
            w-[92%] max-w-[420px]
            bg-white/95 backdrop-blur
            border shadow-2xl
            rounded-3xl
            p-3
            z-[60]
          "
        >
          <div className="grid grid-cols-3 gap-2">
            {more.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);

              return (
                <button
                  key={item.path}
                  onClick={() => {
                    setMoreOpen(false);
                    router.push(item.path);
                  }}
                  className={`
                    flex flex-col items-center justify-center
                    rounded-2xl px-3 py-3 text-xs
                    transition
                    ${
                      active
                        ? "bg-[#0b1220] text-white"
                        : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                    }
                  `}
                >
                  <Icon size={18} />
                  <span className="mt-1 text-[11px]">{item.label}</span>
                </button>
              );
            })}

            {/* LOGOUT */}
            <button
              onClick={() => {
                setMoreOpen(false);
                logout();
              }}
              className="
                flex flex-col items-center justify-center
                rounded-2xl px-3 py-3 text-xs
                bg-red-50 text-red-700 hover:bg-red-100
                transition
              "
            >
              <LogOut size={18} />
              <span className="mt-1 text-[11px]">Logout</span>
            </button>
          </div>
        </div>
      )}

      {/* FLOATING PILL NAV */}
      <nav
        className="
          fixed bottom-5 left-1/2 -translate-x-1/2
          bg-[#eef1f6]/90 backdrop-blur
          border shadow-xl
          rounded-full
          px-3 py-2
          flex items-center gap-2
          z-50
        "
      >
        {main.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <button
              key={item.path}
              onClick={() => {
                setMoreOpen(false);
                router.push(item.path);
              }}
              className={`
                flex flex-col items-center justify-center
                w-16 py-2 rounded-full text-xs
                transition
                ${
                  active
                    ? "bg-[#0b1220] text-white"
                    : "text-gray-600 hover:bg-gray-200"
                }
              `}
            >
              <Icon size={18} />
              <span className="mt-1 text-[10px]">{item.label}</span>
            </button>
          );
        })}

        {/* MORE */}
        <button
          onClick={() => setMoreOpen((v) => !v)}
          className={`
            flex flex-col items-center justify-center
            w-16 py-2 rounded-full text-xs
            transition
            ${moreOpen ? "bg-[#3b485f] text-white" : "text-gray-600 hover:bg-gray-200"}
          `}
        >
          <MoreHorizontal size={18} />
          <span className="mt-1 text-[10px]">More</span>
        </button>
      </nav>
    </>
  );
}