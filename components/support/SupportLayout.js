import SupportSidebar from "./SupportSidebar";
import SupportTopbar from "./SupportTopbar";

export default function SupportLayout({ children }) {
  return (
    <div className="min-h-screen flex bg-gray-50">
      <SupportSidebar />
      <div className="flex-1 flex flex-col">
        <SupportTopbar />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}