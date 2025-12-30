export function StatusBadge({ status }) {
  const s = (status || "open").toLowerCase();

  const cls =
    s === "resolved"
      ? "bg-black text-white"
      : s === "in_progress"
      ? "bg-white text-black border border-black"
      : "bg-white text-black border border-black/20";

  const label =
    s === "in_progress" ? "In Progress" : s.charAt(0).toUpperCase() + s.slice(1);

  return (
    <span className={`px-3 py-1 rounded-full text-[11px] font-bold ${cls}`}>
      {label}
    </span>
  );
}

export function PriorityBadge({ priority }) {
  const p = (priority || "low").toLowerCase();

  const cls =
    p === "critical"
      ? "bg-black text-white"
      : p === "high"
      ? "bg-white text-black border border-black"
      : p === "medium"
      ? "bg-white text-black border border-black/20"
      : "bg-white text-black border border-black/10";

  const label = p.charAt(0).toUpperCase() + p.slice(1);

  return (
    <span className={`px-3 py-1 rounded-full text-[11px] font-bold ${cls}`}>
      {label}
    </span>
  );
}