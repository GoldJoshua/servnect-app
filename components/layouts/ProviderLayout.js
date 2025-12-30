// UI LAYOUT ONLY – SAFE
// No auth, no role logic

import ProviderFloatingNav from "../provider/ProviderFloatingNav";

export default function ProviderLayout({
  children,
  activationPaid = true, // 🔓 DEFAULT UNLOCKED
}) {
  return (
    <>
      {/* Prevent content from hiding behind floating pill */}
      <main className="pb-32">
        {children}
      </main>

      <ProviderFloatingNav activationPaid={activationPaid} />
    </>
  );
}