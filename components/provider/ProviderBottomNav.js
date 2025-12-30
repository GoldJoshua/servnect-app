// components/provider/ProviderBottomNav.js
import { useState } from "react";
import {
  Home,
  Briefcase,
  MessageSquare,
  Crown,
  Menu,
} from "lucide-react";
import ProviderNavItem from "./ProviderNavItem";
import ProviderMoreSheet from "./ProviderMoreSheet";

export default function ProviderBottomNav() {
  const [openMore, setOpenMore] = useState(false);

  return (
    <>
      <nav
        className="
          fixed bottom-0 left-0 right-0 z-30
          bg-[#F4F6F8]
          border-t
          shadow-lg
          backdrop-blur
        "
      >
        <div className="flex justify-around py-3 md:flex-wrap md:gap-6 md:justify-center">
          <ProviderNavItem
            icon={Home}
            label="Dashboard"
            href="/provider/dashboard"
            activePaths={["/provider/dashboard"]}
          />

          <ProviderNavItem
            icon={Briefcase}
            label="Jobs"
            href="/provider/jobs"
            activePaths={["/provider/jobs"]}
          />

          <ProviderNavItem
            icon={MessageSquare}
            label="Messages"
            href="/provider/messages"
            activePaths={["/provider/messages"]}
          />

          <ProviderNavItem
            icon={Crown}
            label="Subscriptions"
            href="/provider/subscriptions"
            activePaths={["/provider/subscriptions"]}
          />

          {/* MOBILE ONLY */}
          <div className="md:hidden">
            <ProviderNavItem
              icon={Menu}
              label="More"
              onClick={() => setOpenMore(true)}
            />
          </div>

          {/* DESKTOP / TABLET EXTRA ITEMS */}
          <div className="hidden md:flex gap-6">
            <ProviderNavItem icon={Menu} label="Referrals" href="/provider/referrals" />
            <ProviderNavItem icon={Menu} label="Wallet" href="/provider/wallet" />
            <ProviderNavItem icon={Menu} label="Support" href="/provider/support" />
            <ProviderNavItem icon={Menu} label="Settings" href="/provider/settings" />
          </div>
        </div>
      </nav>

      <ProviderMoreSheet open={openMore} onClose={() => setOpenMore(false)} />
    </>
  );
}