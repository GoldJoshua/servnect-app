export const PLAN_LIMITS = {
  free: 2,
  basic: 999999,
  premium: 999999,
};

export function normalizePlan(plan) {
  const p = String(plan || "free").toLowerCase();
  if (p === "basic" || p === "premium" || p === "free") return p;
  return "free";
}

export function monthRange(d = new Date()) {
  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
  return { start: start.toISOString(), end: end.toISOString() };
}