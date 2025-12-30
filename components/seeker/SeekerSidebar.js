import { useState } from "react";
import { useRouter } from "next/router";
import {
  Home,
  Search,
  MessageCircle,
  Wallet,
  LifeBuoy,
  Settings,
  Menu,
  X,
} from "lucide-react";

export default function SeekerMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const menuItems = [
    { name: "Dashboard", icon: <Home size={20} />, link: "/seeker/dashboard" },
    { name: "Find Services", icon: <Search size={20} />, link: "/seeker/find" },
    { name: "Messages", icon: <MessageCircle size={20} />, link: "/seeker/messages" },
    { name: "Wallet", icon: <Wallet size={20} />, link: "/seeker/wallet" },
    { name: "Support", icon: <LifeBuoy size={20} />, link: "/seeker/support" },
    { name: "Settings", icon: <Settings size={20} />, link: "/seeker/settings" },
  ];

  return (
    <>
      {/* MOBILE MENU BUTTON */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 bg-white p-3 rounded-full shadow-md border"
        onClick={() => setOpen(true)}
      >
        <Menu size={22} />
      </button>

      {/* MOBILE DRAWER */}
      {open && (
        <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setOpen(false)} />
      )}

      <div
        className={`fixed top-0 left-0 h-full bg-[#0b1220] text-white p-6 z-50 transform 
          ${open ? "translate-x-0" : "-translate-x-full"} 
          transition-transform duration-300 lg:translate-x-0 lg:w-64`}
      >
        {/* Close button mobile */}
        <button
          className="lg:hidden absolute top-4 right-4 text-white"
          onClick={() => setOpen(false)}
        >
          <X size={24} />
        </button>

        {/* Logo */}
        <div className="text-2xl font-extrabold tracking-wide mb-10">
          ServiceConnect
        </div>

        {/* Menu items */}
        <nav className="space-y-4">
          {menuItems.map((item) => (
            <button
              key={item.name}
              onClick={() => router.push(item.link)}
              className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl 
                ${
                  router.pathname === item.link
                    ? "bg-white text-[#0b1220] font-semibold"
                    : "text-gray-200 hover:bg-white/10"
                }`}
            >
              {item.icon}
              {item.name}
            </button>
          ))}
        </nav>
      </div>
    </>
  );
}