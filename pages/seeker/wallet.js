// pages/seeker/wallet.js

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import {
  CreditCard,
  ArrowDownCircle,
  ArrowUpCircle,
  Send,
  Download,
  ChevronDown,
  ChevronUp,
  LayoutDashboard,
  Search,
  MessageCircle,
  Wallet,
  HelpCircle,
  Settings,
  LogOut,
} from "lucide-react";
import SeekerSidebar from "../../components/SeekerSidebar";
import SeekerLayout from "../../components/layouts/SeekerLayout";
import RequireRole from "../../components/auth/RequireRole";
import { supabase } from "../../lib/supabaseClient";

function SeekerWalletContent() {
  const router = useRouter();

  // 🔒 WALLET TEMPORARILY DISABLED
  // State & logic intentionally preserved for future activation

  function goToDashboard() {
    router.push("/seeker/dashboard");
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const menuItems = [
    { label: "Dashboard", icon: <LayoutDashboard size={18} />, href: "/seeker/dashboard" },
    { label: "Find Services", icon: <Search size={18} />, href: "/seeker/find" },
    { label: "Messages / Live Chat", icon: <MessageCircle size={18} />, href: "/seeker/messages" },
    { label: "Wallet", icon: <Wallet size={18} />, href: "/seeker/wallet" },
    { label: "Support", icon: <HelpCircle size={18} />, href: "/seeker/support" },
    { label: "Settings", icon: <Settings size={18} />, href: "/seeker/settings" },
  ];

  return (
    <SeekerLayout>
      <div className="min-h-screen flex bg-[#eef1f6] relative">
        {/* DESKTOP SIDEBAR */}
        <div className="hidden lg:block">
          <SeekerSidebar />
        </div>

        <div className="flex-1 flex flex-col relative">
          {/* DESKTOP HEADER */}
          <header className="hidden lg:flex px-6 py-4 bg-white border-b items-center justify-between">
            <h1 className="text-xl font-semibold flex items-center gap-2">
              <CreditCard size={18} /> Wallet
            </h1>

            <button
              onClick={goToDashboard}
              className="text-xs border px-3 py-1 rounded"
            >
              Back
            </button>
          </header>

          {/* 🔒 WALLET CONTENT (INTENTIONALLY DISABLED) */}
          <main className="flex-1 px-6 py-6 opacity-30 pointer-events-none">
            <div className="bg-[#0b1220] text-white rounded-3xl p-6">
              <div className="text-sm text-white/70">Available balance</div>
              <div className="text-3xl font-bold">₦0</div>

              <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white/10 py-3 rounded-xl text-center text-xs">
                  Add money
                </div>
                <div className="bg-white/10 py-3 rounded-xl text-center text-xs">
                  Withdraw
                </div>
                <div className="bg-white/10 py-3 rounded-xl text-center text-xs">
                  Send
                </div>
                <div className="bg-white/10 py-3 rounded-xl text-center text-xs">
                  Receive
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl border mt-6 p-6 text-sm text-gray-400">
              Transaction history will appear here.
            </div>
          </main>

          {/* 🔒 PERSISTENT OVERLAY */}
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl">
              <h2 className="text-xl font-bold text-[#0b1220] mb-2">
                Wallet coming soon
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Wallet features (payments, withdrawals, escrow, transfers) will be
                available in <strong>Q4 2026</strong>.
              </p>
              <div className="text-xs text-gray-400">
                You can continue using ServiceConnect to find and manage jobs.
              </div>
            </div>
          </div>
        </div>
      </div>
    </SeekerLayout>
  );
}

export default function SeekerWallet() {
  return (
    <RequireRole role="seeker">
      <SeekerWalletContent />
    </RequireRole>
  );
}