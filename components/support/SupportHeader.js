import { Bell, HelpCircle } from "lucide-react";

export default function SupportHeader() {
  return (
    <header className="w-full flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
      <input
        type="text"
        placeholder="Search tickets, users, or articles..."
        className="w-full max-w-md px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
      />

      <div className="flex items-center gap-4 ml-6">
        <Bell size={18} className="text-gray-600 cursor-pointer" />
        <HelpCircle size={18} className="text-gray-600 cursor-pointer" />
      </div>
    </header>
  );
}