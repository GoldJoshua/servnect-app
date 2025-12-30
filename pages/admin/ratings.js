import { useEffect, useState } from "react";
import RequireAdmin from "../../components/auth/RequireAdmin";
import AdminLayout from "../../components/admin/AdminLayout";
import { supabase } from "../../lib/supabaseClient";

export default function AdminRatings() {
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let channel;

    async function loadRatings() {
      setLoading(true);

      const { data } = await supabase
        .from("ratings")
        .select(
          `
          id,
          rating,
          review,
          created_at,
          seeker_id,
          provider_id,
          job_id
        `
        )
        .order("created_at", { ascending: false });

      setRatings(data || []);
      setLoading(false);

      // 🔴 REALTIME updates
      channel = supabase
        .channel("admin-ratings-realtime")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "ratings" },
          async () => {
            const { data } = await supabase
              .from("ratings")
              .select(
                "id, rating, review, created_at, seeker_id, provider_id, job_id"
              )
              .order("created_at", { ascending: false });

            setRatings(data || []);
          }
        )
        .subscribe();
    }

    loadRatings();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  async function removeRating(id) {
    await supabase.from("ratings").delete().eq("id", id);

    setRatings((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <RequireAdmin>
      <AdminLayout title="Ratings Moderation">
        <h1 className="text-2xl font-bold mb-6">Ratings Moderation</h1>

        {loading ? (
          <div className="text-gray-500">Loading ratings…</div>
        ) : ratings.length === 0 ? (
          <div className="bg-white rounded-xl border p-6 text-gray-500">
            No ratings found.
          </div>
        ) : (
          <div className="space-y-4">
            {ratings.map((r) => (
              <div
                key={r.id}
                className="bg-white border rounded-2xl p-5 flex justify-between gap-6"
              >
                {/* LEFT */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-[#0b1220]">
                      ⭐ {r.rating}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(r.created_at).toLocaleString()}
                    </span>
                  </div>

                  {r.review && (
                    <p className="text-sm text-gray-600 mt-2">
                      {r.review}
                    </p>
                  )}

                  <div className="text-xs text-gray-400 mt-3">
                    Job ID: {r.job_id}
                  </div>
                </div>

                {/* RIGHT – ACTIONS */}
                <div className="flex items-start">
                  <button
                    onClick={() => removeRating(r.id)}
                    className="px-4 py-2 rounded-xl bg-gray-600 text-white text-sm font-semibold hover:bg-gray-700"
                  >
                    Delete Rating
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </AdminLayout>
    </RequireAdmin>
  );
}