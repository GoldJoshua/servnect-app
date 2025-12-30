// pages/admin/role-requests.js

// 🔒 AUTH LOCKED – DO NOT MODIFY AUTH LOGIC
// Admin → Role Requests
// - View pending role requests
// - Approve → auto-create subcategory + attach to provider + notify provider
// - Decline → mark as declined + notify provider
// - No side effects outside this flow

import { useEffect, useState } from "react";
import RequireAdmin from "../../components/auth/RequireAdmin";
import AdminLayout from "../../components/admin/AdminLayout";
import { supabase } from "../../lib/supabaseClient";
import { Check, X } from "lucide-react";

export default function AdminRoleRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  // ─────────────────────────────────────────────
  // LOAD PENDING ROLE REQUESTS
  // ─────────────────────────────────────────────
  useEffect(() => {
    loadRequests();
  }, []);

  async function loadRequests() {
    setLoading(true);

    const { data, error } = await supabase
      .from("provider_role_requests")
      .select(`
        id,
        role_name,
        status,
        created_at,
        provider_id,
        category_id,
        profiles:provider_id (
          email,
          full_name,
          first_name,
          last_name
        ),
        service_categories:category_id (
          name
        )
      )
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (!error) {
      setRequests(data || []);
    }

    setLoading(false);
  }

  function getProviderName(profile) {
    if (!profile) return "—";
    return (
      profile.full_name ||
      [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
      profile.email
    );
  }

  // ─────────────────────────────────────────────
  // APPROVE ROLE REQUEST
  // ─────────────────────────────────────────────
  async function approveRequest(req) {
    if (processingId) return;
    setProcessingId(req.id);

    try {
      // 1️⃣ Check if subcategory already exists
      const { data: existingSub } = await supabase
        .from("service_subcategories")
        .select("id")
        .eq("category_id", req.category_id)
        .ilike("name", req.role_name)
        .maybeSingle();

      let subcategoryId = existingSub?.id;

      // 2️⃣ If not exists, create it
      if (!subcategoryId) {
        const { data: newSub, error: subErr } = await supabase
          .from("service_subcategories")
          .insert({
            category_id: req.category_id,
            name: req.role_name,
            is_active: true,
          })
          .select("id")
          .single();

        if (subErr) throw subErr;
        subcategoryId = newSub.id;
      }

      // 3️⃣ Attach role to provider (if not already attached)
      const { data: existingService } = await supabase
        .from("provider_services")
        .select("id")
        .eq("provider_id", req.provider_id)
        .eq("subcategory_id", subcategoryId)
        .maybeSingle();

      if (!existingService) {
        const { error: psErr } = await supabase
          .from("provider_services")
          .insert({
            provider_id: req.provider_id,
            subcategory_id: subcategoryId,
          });

        if (psErr) throw psErr;
      }

      // 4️⃣ Mark request as approved
      await supabase
        .from("provider_role_requests")
        .update({ status: "approved" })
        .eq("id", req.id);

      // 5️⃣ Notify provider (IN-APP)
      await supabase.from("notifications").insert({
        user_id: req.provider_id,
        type: "role",
        title: "Role approved",
        body: `Your requested role "${req.role_name}" has been approved and added to your profile.`,
      });

      // 6️⃣ Refresh list
      await loadRequests();
    } catch (err) {
      alert("Failed to approve role request.");
      console.error(err);
    }

    setProcessingId(null);
  }

  // ─────────────────────────────────────────────
  // DECLINE ROLE REQUEST
  // ─────────────────────────────────────────────
  async function declineRequest(req) {
    if (processingId) return;
    setProcessingId(req.id);

    try {
      // 1️⃣ Mark request as declined
      await supabase
        .from("provider_role_requests")
        .update({ status: "declined" })
        .eq("id", req.id);

      // 2️⃣ Notify provider (IN-APP)
      await supabase.from("notifications").insert({
        user_id: req.provider_id,
        type: "role",
        title: "Role declined",
        body: `Your requested role “${req.role_name}” was declined by admin.`,
      });

      // 3️⃣ Refresh list
      await loadRequests();
    } catch (err) {
      alert("Failed to decline role request.");
      console.error(err);
    }

    setProcessingId(null);
  }

  return (
    <RequireAdmin>
      <AdminLayout>
        <div className="p-6">
          <h1 className="text-2xl font-bold text-[#07102a] mb-6">
            Role Requests
          </h1>

          {loading ? (
            <div className="text-gray-500">Loading requests…</div>
          ) : requests.length === 0 ? (
            <div className="text-gray-500">No pending role requests.</div>
          ) : (
            <div className="overflow-x-auto bg-white rounded-xl shadow border border-gray-100">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-4 py-3 text-left">Provider</th>
                    <th className="px-4 py-3 text-left">Email</th>
                    <th className="px-4 py-3 text-left">Requested Role</th>
                    <th className="px-4 py-3 text-left">Category</th>
                    <th className="px-4 py-3 text-left">Requested At</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((req) => (
                    <tr
                      key={req.id}
                      className="border-t border-gray-100 hover:bg-gray-50"
                    >
                      <td className="px-4 py-3">
                        {getProviderName(req.profiles)}
                      </td>
                      <td className="px-4 py-3">
                        {req.profiles?.email || "—"}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {req.role_name}
                      </td>
                      <td className="px-4 py-3">
                        {req.service_categories?.name || "—"}
                      </td>
                      <td className="px-4 py-3">
                        {new Date(req.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => approveRequest(req)}
                            disabled={processingId === req.id}
                            className="p-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                            title="Approve"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            onClick={() => declineRequest(req)}
                            disabled={processingId === req.id}
                            className="p-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                            title="Decline"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </AdminLayout>
    </RequireAdmin>
  );
}