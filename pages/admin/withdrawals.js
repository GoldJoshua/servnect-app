// pages/admin/withdrawals.js
// 🔒 AUTH LOCKED – DO NOT MODIFY AUTH LOGIC
// Admin withdrawal approval dashboard (real DB)

import { useEffect, useMemo, useState } from "react";
import RequireRole from "../../components/auth/RequireRole";
import { supabase } from "../../lib/supabaseClient";

export default function AdminWithdrawalsPage() {
  return (
    <RequireRole role="admin">
      <AdminWithdrawals />
    </RequireRole>
  );
}

function AdminWithdrawals() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [filter, setFilter] = useState("pending"); // pending | approved | paid | rejected | all
  const [error, setError] = useState("");

  const [actingId, setActingId] = useState(null);
  const [note, setNote] = useState("");

  useEffect(() => {
    let channel;
    let mounted = true;

    async function load() {
      setLoading(true);
      setError("");

      const { data, error: e } = await supabase
        .from("withdrawal_requests")
        .select("id, user_id, wallet_id, amount, currency, status, note, created_at")
        .order("created_at", { ascending: false })
        .limit(200);

      if (!mounted) return;

      if (e) {
        console.error(e);
        setError(e.message || "Failed to load withdrawals");
        setRows([]);
        setLoading(false);
        return;
      }

      setRows(data || []);
      setLoading(false);

      channel = supabase
        .channel("admin-withdrawals-live")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "withdrawal_requests" },
          (payload) => {
            if (payload.eventType === "INSERT") {
              setRows((prev) => [payload.new, ...prev]);
            } else if (payload.eventType === "UPDATE") {
              setRows((prev) =>
                prev.map((r) => (r.id === payload.new.id ? payload.new : r))
              );
            } else if (payload.eventType === "DELETE") {
              setRows((prev) => prev.filter((r) => r.id !== payload.old.id));
            }
          }
        )
        .subscribe();
    }

    load();

    return () => {
      mounted = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  const filtered = useMemo(() => {
    if (filter === "all") return rows;
    return rows.filter((r) => r.status === filter);
  }, [rows, filter]);

  async function setStatus(id, status) {
    setError("");
    setActingId(id);

    const { error: e } = await supabase.rpc("admin_set_withdrawal_status", {
      p_request_id: id,
      p_status: status,
      p_admin_note: note || null,
    });

    setActingId(null);

    if (e) {
      console.error(e);
      setError(e.message || "Action failed");
      return;
    }

    setNote("");
  }

  return (
    <div className="min-h-screen bg-[#eef1f6] p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl border p-5 mb-5">
          <h1 className="text-xl font-bold text-[#0b1220]">Withdrawal Requests</h1>
          <p className="text-sm text-gray-500 mt-1">
            Approve, reject, or mark withdrawals as paid. Bank transfer happens outside the platform.
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {["pending", "approved", "paid", "rejected", "all"].map((k) => (
              <button
                key={k}
                onClick={() => setFilter(k)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold border ${
                  filter === k
                    ? "bg-[#0b1220] text-white border-[#0b1220]"
                    : "bg-white text-gray-700"
                }`}
              >
                {k.toUpperCase()}
              </button>
            ))}

            <div className="flex-1" />

            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional admin note (shown to user)"
              className="w-full sm:w-[360px] border rounded-xl px-4 py-2 text-sm"
            />
          </div>

          {error && <div className="mt-3 text-sm text-red-600">{error}</div>}
        </div>

        <div className="bg-white rounded-2xl border overflow-hidden">
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <div className="text-sm font-semibold text-[#0b1220]">
              {loading ? "Loading..." : `${filtered.length} request(s)`}
            </div>
          </div>

          <div className="divide-y">
            {loading ? (
              <div className="p-5 text-sm text-gray-500">Loading requests…</div>
            ) : filtered.length === 0 ? (
              /* ✅ EMPTY STATE (THIS IS THE FIX) */
              <div className="p-10 text-center">
                <h3 className="text-sm font-semibold text-gray-700">
                  No withdrawal requests yet
                </h3>

                <p className="text-xs text-gray-500 mt-2 max-w-md mx-auto">
                  When users request withdrawals from their wallet, they will
                  appear here for admin review and approval.
                </p>

                <div className="mt-4 text-[11px] text-gray-400">
                  This section updates automatically in real time.
                </div>
              </div>
            ) : (
              filtered.map((r) => (
                <div
                  key={r.id}
                  className="p-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="text-sm font-semibold text-[#0b1220]">
                      ₦{Number(r.amount || 0).toLocaleString()} {r.currency || "NGN"}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Status:{" "}
                      <span className="font-semibold">
                        {String(r.status || "").toUpperCase()}
                      </span>{" "}
                      • {r.created_at ? new Date(r.created_at).toLocaleString() : "—"}
                    </div>
                    <div className="text-[11px] text-gray-400 mt-1 font-mono">
                      user: {r.user_id} • wallet: {r.wallet_id} • id: {r.id}
                    </div>
                    {r.note && (
                      <div className="text-xs text-gray-600 mt-2">
                        Note: {r.note}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setStatus(r.id, "approved")}
                      disabled={actingId === r.id || r.status !== "pending"}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold border ${
                        r.status === "pending"
                          ? "bg-gray-800 text-white border-gray-800"
                          : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {actingId === r.id ? "..." : "Approve"}
                    </button>

                    <button
                      onClick={() => setStatus(r.id, "rejected")}
                      disabled={
                        actingId === r.id ||
                        (r.status !== "pending" && r.status !== "approved")
                      }
                      className={`px-4 py-2 rounded-xl text-xs font-semibold border ${
                        r.status === "pending" || r.status === "approved"
                          ? "bg-white text-gray-800"
                          : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {actingId === r.id ? "..." : "Reject"}
                    </button>

                    <button
                      onClick={() => setStatus(r.id, "paid")}
                      disabled={actingId === r.id || r.status !== "approved"}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold border ${
                        r.status === "approved"
                          ? "bg-[#0b1220] text-white border-[#0b1220]"
                          : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {actingId === r.id ? "..." : "Mark Paid"}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}