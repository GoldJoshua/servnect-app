export default function SupportTopbar() {
  return (
    <div className="h-16 bg-white border-b flex items-center px-6">
      <input
        placeholder="Search tickets, users, or articles..."
        className="w-full max-w-xl px-4 py-2 border rounded-lg text-sm"
      />
      <div className="ml-auto flex items-center gap-4">
        <span className="text-sm font-medium">Demo User</span>
      </div>
    </div>
  );
}