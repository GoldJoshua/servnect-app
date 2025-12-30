// 🔒 AUTH LOCKED – DO NOT MODIFY AUTH LOGIC
// Admin – Field Agent Referrals (Step 2 + Step 3)
// - Create field agents + generate unique referral link
// - Real-time stats (Type B) via postgres_changes
// - Clickable numbers to view referred users (name + email)

import { useEffect, useMemo, useState } from "react";
import RequireAdmin from "../../components/auth/RequireAdmin";
import AdminLayout from "../../components/admin/AdminLayout";
import { supabase } from "../../lib/supabaseClient";
import { Plus, Copy, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

function generateAgentCode() {
  return (
    "AGENT-" +
    Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase()
  );
}

function buildAgentLink(code) {
  return `https://app.servnect.com/signup-auth/choose-role?ref=${code}`;
}

export default function AdminReferrals() {
  const [agents, setAgents] = useState([]);
  const [referrals, setReferrals] = useState([]); // all agent referrals (lightweight)
  const [loading, setLoading] = useState(true);

  // Create agent form
  const [name, setName] = useState("");
  const [state, setState] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [creating, setCreating] = useState(false);
  const [err, setErr] = useState("");

  // Clickable stats modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalAgent, setModalAgent] = useState(null); // { id, name, referral_code }
  const [modalFilter, setModalFilter] = useState("all"); // all | paid | unpaid
  const [modalUsers, setModalUsers] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);

  async function loadAgents() {
    const { data, error } = await supabase
      .from("field_agents")
      .select("id, name, email, phone, state, referral_code, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setErr(error.message || "Failed to load field agents.");
      return;
    }

    setAgents(data || []);
  }

  // We only need referrer_id + paid to compute counts fast
  async function loadAgentReferralsLite() {
    const { data, error } = await supabase
      .from("referrals")
      .select("referrer_id, paid")
      .eq("referral_source", "agent");

    if (error) {
      console.error(error);
      setErr(error.message || "Failed to load referrals.");
      return;
    }

    setReferrals(data || []);
  }

  async function loadAll() {
    setLoading(true);
    setErr("");
    await Promise.all([loadAgents(), loadAgentReferralsLite()]);
    setLoading(false);
  }

  useEffect(() => {
    let agentsCh;
    let referralsCh;

    async function init() {
      await loadAll();

      // 🔵 Type B realtime: agents list changes
      agentsCh = supabase
        .channel("admin-field-agents-realtime")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "field_agents" },
          async () => {
            await loadAgents();
          }
        )
        .subscribe();

      // 🔵 Type B realtime: referral stats changes
      referralsCh = supabase
        .channel("admin-agent-referrals-realtime")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "referrals" },
          async (payload) => {
            // Only refresh counts if it looks like an agent referral row changed
            // (safe even if payload doesn't include the column—then we just reload)
            await loadAgentReferralsLite();

            // If modal is open, keep it live too
            if (modalOpen && modalAgent?.id) {
              await loadModalUsers(modalAgent, modalFilter);
            }
          }
        )
        .subscribe();
    }

    init();

    return () => {
      if (agentsCh) supabase.removeChannel(agentsCh);
      if (referralsCh) supabase.removeChannel(referralsCh);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalOpen, modalAgent?.id, modalFilter]);

  const referralStatsByAgent = useMemo(() => {
    // Build map: agentId -> { total, paid, unpaid }
    const map = {};
    for (const r of referrals) {
      const id = r.referrer_id;
      if (!id) continue;
      if (!map[id]) map[id] = { total: 0, paid: 0, unpaid: 0 };
      map[id].total += 1;
      if (r.paid) map[id].paid += 1;
      else map[id].unpaid += 1;
    }
    return map;
  }, [referrals]);

  async function createAgent() {
    setErr("");

    if (!name.trim()) {
      setErr("Field agent name is required.");
      return;
    }
    if (!state.trim()) {
      setErr("State / location is required.");
      return;
    }

    setCreating(true);

    // Try a few times in case of extremely rare UNIQUE collision
    let lastError = null;

    for (let attempt = 0; attempt < 5; attempt++) {
      const code = generateAgentCode();

      const { error } = await supabase.from("field_agents").insert({
        name: name.trim(),
        state: state.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        referral_code: code,
      });

      if (!error) {
        setName("");
        setState("");
        setEmail("");
        setPhone("");
        setCreating(false);
        await loadAgents();
        return;
      }

      lastError = error;

      // If unique collision, retry. Otherwise stop.
      if (!String(error.message || "").toLowerCase().includes("duplicate")) {
        break;
      }
    }

    console.error(lastError);
    setErr(lastError?.message || "Failed to create field agent.");
    setCreating(false);
  }

  async function loadModalUsers(agent, filter) {
    setModalLoading(true);
    setModalUsers([]);

    let q = supabase
      .from("referrals")
      .select(
        `
        paid,
        created_at,
        profiles:referred_user_id (
          full_name,
          email
        )
      `
      )
      .eq("referral_source", "agent")
      .eq("referrer_id", agent.id);

    if (filter === "paid") q = q.eq("paid", true);
    if (filter === "unpaid") q = q.eq("paid", false);

    const { data, error } = await q.order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setErr(error.message || "Failed to load referred users.");
      setModalLoading(false);
      return;
    }

    setModalUsers(data || []);
    setModalLoading(false);
  }

  async function openModal(agent, filter) {
    setModalAgent(agent);
    setModalFilter(filter);
    setModalOpen(true);
    await loadModalUsers(agent, filter);
  }

  function closeModal() {
    setModalOpen(false);
    setModalAgent(null);
    setModalUsers([]);
    setModalFilter("all");
  }

  return (
    <RequireAdmin>
      <AdminLayout title="Field Agent Referrals">
        {/* HEADER */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-[#0b1220]">
              Field Agent Referrals
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Create agents, generate links, and track signups + paid activations in real time.
            </p>
            {err ? <div className="mt-3 text-sm text-gray-600">{err}</div> : null}
          </div>
        </div>

        {/* CREATE AGENT */}
        <div className="bg-white rounded-2xl border shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-lg font-bold text-[#0b1220]">Create Field Agent</div>
            <button
              onClick={createAgent}
              disabled={creating}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold ${
                creating ? "bg-gray-200 text-gray-500 cursor-not-allowed" : "bg-[#3b5bfd] text-white shadow"
              }`}
            >
              <Plus size={16} />
              {creating ? "Creating..." : "Create Agent"}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="text-xs text-gray-500 mb-1 block">Agent Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#3b5bfd]"
                placeholder="e.g., John Okafor"
              />
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1 block">State / Location</label>
              <input
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#3b5bfd]"
                placeholder="e.g., Lagos"
              />
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1 block">Phone (optional)</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#3b5bfd]"
                placeholder="e.g., 080..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs text-gray-500 mb-1 block">Email (optional)</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#3b5bfd]"
                placeholder="e.g., agent@email.com"
              />
            </div>

            <div className="md:col-span-2 text-xs text-gray-500 flex items-end">
              Referral link is generated automatically after creating the agent.
            </div>
          </div>
        </div>

        {/* AGENTS TABLE */}
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <div className="text-lg font-bold text-[#0b1220]">Agents</div>
            <div className="text-xs text-gray-500">
              {loading ? "Loading…" : `${agents.length} agent(s)`}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-6 py-3">Agent</th>
                  <th className="text-left px-6 py-3">State</th>
                  <th className="text-left px-6 py-3">Referral Link</th>
                  <th className="text-left px-6 py-3">Total</th>
                  <th className="text-left px-6 py-3">Paid</th>
                  <th className="text-left px-6 py-3">Unpaid</th>
                </tr>
              </thead>

              <tbody>
                {agents.map((a) => {
                  const s = referralStatsByAgent[a.id] || { total: 0, paid: 0, unpaid: 0 };
                  const link = buildAgentLink(a.referral_code);

                  return (
                    <tr key={a.id} className="border-t">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-[#0b1220]">{a.name}</div>
                        <div className="text-xs text-gray-500">
                          {a.email ? a.email : "—"} {a.phone ? `• ${a.phone}` : ""}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-gray-700">{a.state || "—"}</td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="truncate max-w-[320px] text-gray-700">
                            {link}
                          </div>
                          <button
                            onClick={() => navigator.clipboard.writeText(link)}
                            className="p-2 rounded-lg border hover:bg-gray-50"
                            title="Copy link"
                          >
                            <Copy size={14} />
                          </button>
                        </div>
                        <div className="text-[11px] text-gray-400 mt-1">
                          Code: <span className="font-semibold">{a.referral_code}</span>
                        </div>
                      </td>

                      {/* CLICKABLE STATS */}
                      <td className="px-6 py-4">
                        <button
                          onClick={() => openModal(a, "all")}
                          className="font-semibold text-[#3b5bfd] hover:underline"
                        >
                          {s.total}
                        </button>
                      </td>

                      <td className="px-6 py-4">
                        <button
                          onClick={() => openModal(a, "paid")}
                          className="font-semibold text-[#0b1220] hover:underline"
                        >
                          {s.paid}
                        </button>
                      </td>

                      <td className="px-6 py-4">
                        <button
                          onClick={() => openModal(a, "unpaid")}
                          className="font-semibold text-gray-700 hover:underline"
                        >
                          {s.unpaid}
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {!loading && agents.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-10 text-center text-gray-500">
                      No field agents yet. Create one above.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL – CLICKABLE STATS */}
        <AnimatePresence>
          {modalOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.45 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black z-40"
                onClick={closeModal}
              />

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed z-50 inset-0 flex items-center justify-center p-4"
              >
                <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl border overflow-hidden">
                  <div className="px-5 py-4 border-b flex items-center justify-between">
                    <div>
                      <div className="text-lg font-bold text-[#0b1220]">
                        {modalAgent?.name || "Agent"} –{" "}
                        {modalFilter === "all"
                          ? "All Signups"
                          : modalFilter === "paid"
                          ? "Paid"
                          : "Unpaid"}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Click-to-verify list (Name + Email). Updated live.
                      </div>
                    </div>

                    <button
                      onClick={closeModal}
                      className="p-2 rounded-lg border hover:bg-gray-50"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="p-5">
                    {modalLoading ? (
                      <div className="text-sm text-gray-500">Loading…</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="text-left px-4 py-2">Name</th>
                              <th className="text-left px-4 py-2">Email</th>
                              <th className="text-left px-4 py-2">Status</th>
                              <th className="text-left px-4 py-2">Joined</th>
                            </tr>
                          </thead>
                          <tbody>
                            {modalUsers.map((r, i) => (
                              <tr key={i} className="border-t">
                                <td className="px-4 py-2">
                                  {r.profiles?.full_name || "—"}
                                </td>
                                <td className="px-4 py-2">
                                  {r.profiles?.email || "—"}
                                </td>
                                <td className="px-4 py-2">
                                  {r.paid ? "Paid" : "Unpaid"}
                                </td>
                                <td className="px-4 py-2">
                                  {new Date(r.created_at).toLocaleString()}
                                </td>
                              </tr>
                            ))}

                            {modalUsers.length === 0 && (
                              <tr>
                                <td
                                  colSpan="4"
                                  className="px-4 py-6 text-center text-gray-500"
                                >
                                  No users found for this filter.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </AdminLayout>
    </RequireAdmin>
  );
}