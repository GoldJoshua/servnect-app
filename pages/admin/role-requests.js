// 🔒 AUTH LOCKED – DO NOT MODIFY AUTH LOGIC
// Admin → Role Requests

import { useEffect, useState } from "react";
import RequireAdmin from "../../components/auth/RequireAdmin";
import AdminLayout from "../../components/admin/AdminLayout";
import { supabase } from "../../lib/supabaseClient";
import { Check, X } from "lucide-react";

export default function AdminRoleRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    loadRequests();
  }, []);

  async function loadRequests() {
    setLoading(true);

    const { data } = await supabase
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
      `)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    setRequests(data || []);
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

  async function approveRequest(req) {
    if (processingId) return;
    setProcessingId(req.id);

    try {
      const { data: existingSub } = await supabase
        .from("service_subcategories")
        .select("id")
        .eq("category_id", req.category_id)
        .ilike("name", req.role_name)
        .maybeSingle();

      let subcategoryId = existingSub?.id;

      if (!subcategoryId) {
        const { data: newSub } = await supabase
          .from("service_subcategories")
          .insert({
            category_id: req.category_id,
            name: req.role_name,
            is_active: true,
          })
          .select("id")
          .single();

        subcategoryId = newSub.id;
      }

      const { data: existingService } = await supabase
        .from("provider_services")
        .select("id")
        .eq("provider_id", req.provider_id)
        .eq("subcategory_id", subcategoryId)
        .maybeSingle();

      if (!existingService) {
        await supabase.from("provider_services").insert({
          provider_id: req.provider_id,
          subcategory_id: subcategoryId,
        });
      }

      await supabase
        .from("provider_role_requests")
        .update({ status: "approved" })
        .eq("id", req.id);

      await supabase.from("notifications").insert({
        user_id: req.provider_id,
        type: "role",
        title: "Role approved",
        body:
          "Your requested role " +
          req.role_name +
          " has been approved and added to your profile.",
      });

      await loadRequests();
    } catch (err) {
      console.error(err);
      alert("Failed to approve role request.");
    }

    setProcessingId(null);
  }

  async function declineRequest(req) {
    if (processingId) return;
    setProcessingId(req.id);

    try {
      await supabase
        .from("provider_role_requests")
        .update({ status: "declined" })
        .eq("id", req.id);

      await supabase.from("notifications").insert({
        user_id: req.provider_id,
        type: "role",
        title: "Role declined",
        body:
          "Your requested role " +
          req.role_name +
          " was declined by admin.",
      });

      await loadRequests();
    } catch (err) {
      console.error(err);
      alert("Failed to decline role request.");
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
            <div className="overflow-x-auto bg-white rounded-xl shadow border">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
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
                    <tr key={req.id} className="border-t">
                      <td className="px-4 py-3">
                        {getProviderName(req.profiles)}
                      </td>
                      <td className="px-4 py-3">{req.profiles?.email}</td>
                      <td className="px-4 py-3 font-medium">
                        {req.role_name}
                      </td>
                      <td className="px-4 py-3">
                        {req.service_categories?.name || "—"}
                      </td>
                      <td className="px-4 py-3">
                        {new Date(req.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => approveRequest(req)}
                            className="p-2 bg-green-600 text-white rounded"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            onClick={() => declineRequest(req)}
                            className="p-2 bg-red-600 text-white rounded"
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