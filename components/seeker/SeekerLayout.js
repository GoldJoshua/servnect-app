// UI LAYOUT ONLY – SAFE
// No auth, no business logic
// SeekerSidebar has been retired (bottom nav is canonical)

import SeekerBottomNav from "../seeker/SeekerBottomNav";

export default function SeekerLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#eef1f6] flex flex-col">
      {/* PAGE CONTENT */}
      <main className="flex-1 pb-24">
        {children}
      </main>

      {/* MOBILE + DESKTOP BOTTOM NAV */}
      <SeekerBottomNav />
    </div>
  );
}