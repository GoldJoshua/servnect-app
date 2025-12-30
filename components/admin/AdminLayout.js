// 🔒 AUTH LOCKED – DO NOT MODIFY AUTH LOGIC
// Admin-only layout – persistent sidebar + topbar
// Isolated from seeker/provider UI

import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";

export default function AdminLayout({ children, title = "System Overview" }) {
  return (
    <div className="min-h-screen flex bg-[#0B1220] overflow-hidden">
      {/* SIDEBAR – ALWAYS VISIBLE */}
      <div className="flex-shrink-0">
        <AdminSidebar />
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col bg-[#eef1f6] text-[#0B1220] min-h-screen">
        {/* TOP BAR */}
        <AdminTopbar title={title} />

        {/* PAGE CONTENT */}
        <main className="flex-1 px-8 py-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}