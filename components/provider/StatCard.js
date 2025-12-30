// 🔒 UI ONLY – NO DATA LOGIC
// Reusable realtime-ready Stat Card
// Expects REAL values from parent

export default function StatCard({
  title,
  value,
  loading = false,
  accent = false,
}) {
  return (
    <div
      className={`
        rounded-2xl p-6
        shadow-[0_20px_40px_rgba(11,18,32,0.28)]
        border border-white/5
        text-white
        ${
          accent
            ? "bg-gradient-to-br from-[#0B1220] to-[#111827]"
            : "bg-gradient-to-br from-[#0b1220] to-[#141c2f]"
        }
      `}
    >
      {/* TITLE */}
      <p className="text-[11px] uppercase tracking-widest text-white/60">
        {title}
      </p>

      {/* VALUE */}
      <div className="mt-3">
        {loading ? (
          <div className="h-7 w-24 rounded-md bg-white/10 animate-pulse" />
        ) : (
          <h3 className="text-2xl font-semibold tracking-tight">
            {value}
          </h3>
        )}
      </div>

      {/* DECORATIVE LINE */}
      <div
        className={`mt-4 h-[2px] w-12 ${
          accent
            ? "bg-gradient-to-r from-[#e5e7eb] to-transparent"
            : "bg-gradient-to-r from-white/40 to-transparent"
        }`}
      />
    </div>
  );
}