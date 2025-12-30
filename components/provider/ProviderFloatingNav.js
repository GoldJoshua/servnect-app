// UI ONLY – PROVIDER FLOATING PILL NAV
// No auth logic here. Activation lock is visual + pointer-events only.

import { useState } from "react";
import { useRouter } from "next/router";
import {
  Home,
  Briefcase,
  MessageSquare,
  Crown,
  Menu,
  Share2,
  Wallet,
  Headphones,
  SlidersHorizontal,
  LogOut,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export default function ProviderFloatingNav({ activationPaid = true }) {
  const router = useRouter();
  const [openMore, setOpenMore] = useState(false);

  const locked = !activationPaid;

  return (
    <>
      {/* FLOATING PILL */}
      <motion.nav
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={`
          fixed left-1/2 -translate-x-1/2 bottom-6 z-30
          flex items-center gap-2 px-4 py-3
          rounded-full
          shadow-xl
          backdrop-blur-xl
          bg-[rgba(244,246,248,0.85)]
          ${locked ? "opacity-40 pointer-events-none" : ""}
        `}
      >
        <NavItem
          icon={Home}
          label="Dashboard"
          active={router.pathname.startsWith("/provider/dashboard")}
          onClick={() => router.push("/provider/dashboard")}
        />

        <NavItem
          icon={Briefcase}
          label="Jobs"
          active={router.pathname.startsWith("/provider/jobs")}
          onClick={() => router.push("/provider/jobs")}
        />

        <NavItem
          icon={MessageSquare}
          label="Messages"
          active={router.pathname.startsWith("/provider/messages")}
          onClick={() => router.push("/provider/messages")}
        />

        <NavItem
          icon={Crown}
          label="Plans"
          active={router.pathname.startsWith("/provider/subscriptions")}
          onClick={() => router.push("/provider/subscriptions")}
        />

        <NavItem
          icon={Menu}
          label="More"
          onClick={() => setOpenMore(true)}
        />
      </motion.nav>

      {/* MORE POPOVER */}
      <AnimatePresence>
        {openMore && (
          <>
            <motion.div
              className="fixed inset-0 z-40"
              onClick={() => setOpenMore(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25 }}
              className="
                fixed left-1/2 -translate-x-1/2 bottom-28 z-50
                bg-white rounded-2xl shadow-2xl
                p-4 grid grid-cols-2 gap-3
                w-[260px]
              "
            >
              <MoreItem
                icon={Share2}
                label="Referrals"
                onClick={() => router.push("/provider/referrals")}
              />
              <MoreItem
                icon={Wallet}
                label="Wallet"
                onClick={() => router.push("/provider/wallet")}
              />
              <MoreItem
                icon={Headphones}
                label="Support"
                onClick={() => router.push("/provider/support")}
              />
              <MoreItem
                icon={SlidersHorizontal}
                label="Settings"
                onClick={() => router.push("/provider/settings")}
              />
              <MoreItem
                icon={LogOut}
                label="Logout"
                danger
                onClick={async () => {
                  const { supabase } = await import("../../lib/supabaseClient");
                  await supabase.auth.signOut();
                  router.push("/login");
                }}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

/* ---------- SUB COMPONENTS ---------- */

function NavItem({ icon: Icon, label, onClick, active }) {
  return (
    <button
      onClick={onClick}
      className={`
        flex flex-col sm:flex-row items-center
        gap-1 sm:gap-2
        px-3 py-2 rounded-full
        transition-all
        ${
          active
            ? "bg-[#4F6D8A] text-white shadow"
            : "text-[#4F6D8A] hover:bg-[#e6eaee]"
        }
      `}
    >
      <Icon size={18} />
      <span className="text-[10px] sm:text-sm leading-none">
        {label}
      </span>
    </button>
  );
}

function MoreItem({ icon: Icon, label, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-3 py-2 rounded-xl text-sm
        transition-all
        ${
          danger
            ? "text-red-600 hover:bg-red-50"
            : "text-[#4F6D8A] hover:bg-gray-100"
        }
      `}
    >
      <Icon size={18} />
      {label}
    </button>
  );
}