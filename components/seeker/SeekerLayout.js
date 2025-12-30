import { useState } from "react";
import SeekerSidebar from "../../components/SeekerSidebar";

export default function SeekerLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-[#eef1f6] relative">
      {/* ================= DESKTOP SIDEBAR ================= */}
      <div className="hidden lg:block">
        <SeekerSidebar />
      </div>

      {/* ================= MOBILE OVERLAY ================= */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ================= MOBILE SIDEBAR ================= */}
      <div
        className={`fixed top-0 left-0 h-full w-64 z-50 transform transition-transform duration-300 lg:hidden
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <SeekerSidebar />
      </div>

      {/* ================= MAIN CONTENT ================= */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* MOBILE HEADER */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-[#0b1220] to-[#3b485f] text-white shadow-md">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-2xl leading-none px-2 py-1"
            aria-label="Open menu"
          >
            ☰
          </button>

          <div>
            <div className="text-sm font-semibold">ServiceConnect</div>
            <div className="text-[11px] text-white/70">Client Dashboard</div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}