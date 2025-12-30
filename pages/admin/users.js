import { useEffect, useState } from "react";
import RequireAdmin from "../../components/auth/RequireAdmin";
import AdminLayout from "../../components/admin/AdminLayout";
import { supabase } from "../../lib/supabaseClient";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [adminId, setAdminId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);

      const { data: auth } = await supabase.auth.getUser();
      setAdminId(auth?.user?.id || null);

      const { data } = await supabase
        .from("profiles")
        .select("id, email, role, is_banned, created_at")
        .order("created_at", { ascending: false });

      setUsers(data || []);
      setLoading(false);
    }

    load();
  }, []);

  async function updateRole(userId, role) {
    if (userId === adminId) {
      alert("You cannot change your own role.");
      return;
    }

    await supabase.from("profiles").update({ role }).eq("id", userId);

    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role } : u))
    );
  }

  async function toggleBan(userId, isBanned) {
    if (userId === adminId) {
      alert("You cannot ban yourself.");
      return;
    }

    await supabase
      .from("profiles")
      .update({ is_banned: !isBanned })
      .eq("id", userId);

    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId ? { ...u, is_banned: !isBanned } : u
      )
    );
  }

  return (
    <RequireAdmin>
      <AdminLayout title="User Management">
        <h1 className="text-2xl font-bold mb-6">User Management</h1>

        <div className="bg-white rounded-xl border overflow-hidden">
          {loading ? (
            <div className="p-6 text-gray-500">Loading users…</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 text-left">Email</th>
                  <th className="p-3 text-center">Role</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>

              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t">
                    <td className="p-3">{u.email}</td>

                    <td className="p-3 text-center font-semibold">
                      {u.role}
                    </td>

                    <td className="p-3 text-center">
                      {u.is_banned ? (
                        <span className="text-gray-600 font-semibold">
                          Banned
                        </span>
                      ) : (
                        <span className="text-gray-600 font-semibold">
                          Active
                        </span>
                      )}
                    </td>

                    <td className="p-3">
                      <div className="flex gap-2 justify-center flex-wrap">
                        <button
                          onClick={() => updateRole(u.id, "seeker")}
                          className="px-3 py-1 rounded bg-gray-200"
                        >
                          Seeker
                        </button>

                        <button
                          onClick={() => updateRole(u.id, "provider")}
                          className="px-3 py-1 rounded bg-gray-600 text-white"
                        >
                          Provider
                        </button>

                        <button
                          onClick={() => updateRole(u.id, "admin")}
                          className="px-3 py-1 rounded bg-black text-white"
                        >
                          Admin
                        </button>

                        <button
                          onClick={() => toggleBan(u.id, u.is_banned)}
                          className={`px-3 py-1 rounded text-white ${
                            u.is_banned ? "bg-gray-600" : "bg-gray-600"
                          }`}
                        >
                          {u.is_banned ? "Unban" : "Ban"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </AdminLayout>
    </RequireAdmin>
  );
}