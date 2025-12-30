// components/provider/ProviderMoreSheet.js
import { motion, AnimatePresence } from "framer-motion";
import {
  Share2,
  CreditCard,
  LifeBuoy,
  Settings,
  LogOut,
} from "lucide-react";
import { useRouter } from "next/router";
import { supabase } from "../../lib/supabaseClient";

export default function ProviderMoreSheet({ open, onClose }) {
  const router = useRouter();

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/30 z-40"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl p-6"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25 }}
          >
            <div className="grid gap-4">
              <MenuItem icon={Share2} label="Referrals" onClick={() => router.push("/provider/referrals")} />
              <MenuItem icon={CreditCard} label="Wallet" onClick={() => router.push("/provider/wallet")} />
              <MenuItem icon={LifeBuoy} label="Support" onClick={() => router.push("/provider/support")} />
              <MenuItem icon={Settings} label="Settings" onClick={() => router.push("/provider/settings")} />
              <MenuItem icon={LogOut} label="Logout" danger onClick={logout} />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function MenuItem({ icon: Icon, label, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 text-sm ${
        danger ? "text-red-600" : "text-[#4F6D8A]"
      }`}
    >
      <Icon size={20} />
      {label}
    </button>
  );
}