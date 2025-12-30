// 🔒 AUTH LOCKED – DO NOT MODIFY AUTH LOGIC
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "../../lib/supabaseClient";

export default function ProviderList() {
  const router = useRouter();
  const { categoryId, subcategoryId } = router.query;

  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [jobDesc, setJobDesc] = useState("");

  useEffect(() => {
    if (!categoryId || !subcategoryId) return;

    let alive = true;
    (async () => {
      setLoading(true);

      // Find providers mapped to this subcategory
      const { data: serviceRows, error: sErr } = await supabase
        .from("provider_services")
        .select("provider_id")
        .eq("category_id", categoryId)
        .eq("subcategory_id", subcategoryId);

      if (!alive) return;

      if (sErr) {
        console.error(sErr);
        setProviders([]);
        setLoading(false);
        return;
      }

      const ids = Array.from(
        new Set((serviceRows || []).map((r) => r.provider_id).filter(Boolean))
      );

      if (ids.length === 0) {
        setProviders([]);
        setLoading(false);
        return;
      }

      // Pull provider profiles (NO EMAILS)
      const { data: profs, error: pErr } = await supabase
        .from("profiles")
        .select("id, name, state, rating, subscription_plan, is_active")
        .in("id", ids);

      if (!alive) return;

      if (pErr) {
        console.error(pErr);
        setProviders([]);
        setLoading(false);
        return;
      }

      const list = (profs || []).filter((p) => p.is_active !== false);

      // INTERNAL SORTING (tiers hidden from seeker)
      const rank = (plan) => {
        const p = String(plan || "free").toLowerCase();
        if (p === "premium") return 1;
        if (p === "basic") return 2;
        return 3;
      };

      list.sort((a, b) => {
        const ra = rank(a.subscription_plan);
        const rb = rank(b.subscription_plan);
        if (ra !== rb) return ra - rb;

        const ar = Number(a.rating || 0);
        const br = Number(b.rating || 0);
        if (br !== ar) return br - ar;

        return String(a.name || "").localeCompare(String(b.name || ""));
      });

      setProviders(list);
      setLoading(false);
    })();

    return () => (alive = false);
  }, [categoryId, subcategoryId]);

  // ✅ SAFE DISPLAY NAME (NO EMAIL EVER)
  const displayName = (p) => {
    if (!p?.name) return "Provider";
    if (String(p.name).includes("@")) return "Provider";
    return String(p.name).trim();
  };

  async function openContact(p) {
    setSelectedProvider(p);
    setJobDesc("");
    setShowModal(true);
  }

  async function continueToChat() {
    if (!selectedProvider?.id) return;
    if (!jobDesc.trim()) {
      alert("Please describe the job.");
      return;
    }

    const { data: auth } = await supabase.auth.getUser();
    const seeker = auth?.user;
    if (!seeker) {
      alert("Please login.");
      return;
    }

    const { data: job, error } = await supabase
      .from("jobs")
      .insert({
        seeker_id: seeker.id,
        provider_id: selectedProvider.id,
        status: "pending",
        notes: jobDesc.trim(),
      })
      .select("id")
      .single();

    if (error || !job?.id) {
      console.error(error);
      alert("Failed to create job chat.");
      return;
    }

    setShowModal(false);
    router.push(`/chat/${job.id}`);
  }

  return (
    <div style={{ maxWidth: 820, margin: "24px auto", padding: 16 }}>
      <h2 style={{ marginBottom: 12 }}>Available Providers</h2>

      <div
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 14,
          padding: 16,
          background: "#fff",
        }}
      >
        {loading ? (
          <div style={{ color: "#6b7280" }}>Loading providers…</div>
        ) : providers.length === 0 ? (
          <div style={{ color: "#6b7280" }}>
            No providers found for this service yet.
          </div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {providers.map((p) => (
              <div
                key={p.id}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 12,
                  padding: 12,
                }}
              >
                <div style={{ fontWeight: 900 }}>{displayName(p)}</div>
                <div style={{ color: "#6b7280", marginTop: 4 }}>
                  {p.state ? `Location: ${p.state}` : "Location: —"}
                </div>
                <div style={{ marginTop: 6, fontSize: 13 }}>
                  Rating:{" "}
                  <b>
                    {p.rating != null
                      ? Number(p.rating).toFixed(1)
                      : "—"}
                  </b>
                </div>

                <button
                  onClick={() => openContact(p)}
                  style={{
                    marginTop: 10,
                    width: "100%",
                    padding: 12,
                    borderRadius: 12,
                    border: "1px solid #0b1220",
                    background: "#0b1220",
                    color: "#fff",
                    fontWeight: 900,
                    cursor: "pointer",
                  }}
                >
                  Contact Provider
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Describe job modal */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 560,
              background: "#fff",
              borderRadius: 14,
              padding: 16,
            }}
          >
            <div style={{ fontWeight: 900, marginBottom: 8 }}>
              Describe your job
            </div>
            <textarea
              value={jobDesc}
              onChange={(e) => setJobDesc(e.target.value)}
              rows={4}
              style={{
                width: "100%",
                borderRadius: 12,
                border: "1px solid #e5e7eb",
                padding: 12,
              }}
              placeholder="Briefly describe what you need…"
            />

            <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 12,
                  border: "1px solid #e5e7eb",
                  background: "#fff",
                  fontWeight: 900,
                }}
              >
                Cancel
              </button>
              <button
                onClick={continueToChat}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 12,
                  border: "1px solid #0b1220",
                  background: "#0b1220",
                  color: "#fff",
                  fontWeight: 900,
                }}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}