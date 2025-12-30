// 🔒 AUTH LOCKED – DO NOT MODIFY
// This page is protected by RequireRole (provider only).
// UI changes are allowed. Auth logic must stay in RequireRole.

import { useEffect, useState } from "react";
import RequireRole from "../../components/auth/RequireRole";
import { supabase } from "../../lib/supabaseClient";

import ProviderLayout from "../../components/layouts/ProviderLayout";
import ProviderHeader from "../../components/provider/ProviderHeader";

function ProviderWalletContent() {
  const [name, setName] = useState("Provider");
  const [activationPaid, setActivationPaid] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("name, activation_paid")
        .eq("id", user.id)
        .single();

      if (profile?.name) setName(profile.name.split(" ")[0]);
      setActivationPaid(profile?.activation_paid === true);
    }

    loadProfile();
  }, []);

  return (
    <ProviderLayout>
      <div className="min-h-screen bg-[#eef1f6] relative">
        <main className="flex-1 px-6 py-6 relative">
          <ProviderHeader name={name} />

          {/* 🔒 WALLET UI (DISABLED BUT PRESERVED) */}
          <div className="opacity-30 pointer-events-none">
            <div
              className="bg-gradient-to-br from-[#0b1220] to-[#3b485f]
                       text-white rounded-3xl p-6 shadow-xl mb-8"
            >
              <div className="text-sm text-white/70 mb-1">
                Available Balance
              </div>
              <div className="text-4xl font-extrabold">₦0</div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
                <div className="bg-white/10 py-3 rounded-xl text-center text-sm">
                  Add Money
                </div>
                <div className="bg-white/10 py-3 rounded-xl text-center text-sm">
                  Withdraw
                </div>
                <div className="bg-white/10 py-3 rounded-xl text-center text-sm">
                  Send
                </div>
                <div className="bg-white/10 py-3 rounded-xl text-center text-sm">
                  Receive
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow border text-sm text-gray-400">
              Transaction history will appear here.
            </div>
          </div>

          {/* 🔒 PERSISTENT OVERLAY */}
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl">
              <h2 className="text-xl font-bold text-[#0b1220] mb-2">
                Wallet coming soon
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Wallet features (payments, withdrawals, escrow) will be available
                in <strong>Q4 2026</strong>.
              </p>
              <div className="text-xs text-gray-400">
                You can continue receiving and managing jobs on the platform.
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProviderLayout>
  );
}

export default function ProviderWallet() {
  return (
    <RequireRole role="provider">
      <ProviderWalletContent />
    </RequireRole>
  );
}