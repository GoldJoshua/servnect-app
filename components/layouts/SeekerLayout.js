// UI LAYOUT ONLY – SAFE
// No auth, no business logic

import SeekerBottomNav from "../seeker/SeekerBottomNav";
import SeekerSidebar from "../SeekerSidebar";

export default function SeekerLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#eef1f6]">
      <div className="flex">
        {/* DESKTOP SIDEBAR */}
        <aside className="hidden lg:block w-64">
          <SeekerSidebar />
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 pb-24">
          {children}
        </main>
      </div>

      {/* MOBILE BOTTOM NAV */}
      <SeekerBottomNav />
    </div>
  );
}