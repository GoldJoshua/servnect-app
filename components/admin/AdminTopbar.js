import { Bell, Search } from "lucide-react";

export default function AdminTopbar({ title = "System Overview" }) {
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-500">
        <span className="text-gray-400">Admin</span>
        <span className="mx-2">›</span>
        <span className="text-[#3b5bfd] font-semibold">{title}</span>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-2 bg-[#f4f6fb] border border-gray-200 rounded-full px-4 py-2 w-[360px]">
          <Search size={16} className="text-gray-400" />
          <input
            placeholder="Global Search..."
            className="bg-transparent outline-none text-sm w-full"
          />
        </div>

        <button className="relative w-10 h-10 rounded-full bg-[#f4f6fb] border border-gray-200 flex items-center justify-center">
          <Bell size={18} className="text-gray-600" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-gray-500" />
        </button>
      </div>
    </header>
  );
}