// 🔒 AUTH LOCKED – DO NOT MODIFY
// Provider Referrals Page
// UI changes allowed. Auth logic must stay in RequireRole.

import { useEffect, useState } from "react";
import RequireRole from "../../components/auth/RequireRole";
import { supabase } from "../../lib/supabaseClient";

import ProviderLayout from "../../components/layouts/ProviderLayout";
import ProviderHeader from "../../components/provider/ProviderHeader";

function generateReferralCode() {
  return (
    "PROV-" +
    Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase()
  );
}

function ProviderReferralsContent() {
  const [referralCode, setReferralCode] = useState("");
  const [stats, setStats] = useState({ total: 0, paid: 0, unpaid: 0 });
  const [list, setList] = useState([]);
  const [filterPaid, setFilterPaid] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let channel;

    async function init() {
      await loadData();

      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;
      if (!user) return;

      channel = supabase
        .channel("provider-referrals-" + user.id)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "referrals",
            filter: `referrer_id=eq.${user.id}`,
          },
          () => {
            loadData();
            if (filterPaid !== null) loadList(filterPaid);
          }
        )
        .subscribe();
    }

    init();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [filterPaid]);

  async function loadData() {
    setLoading(true);

    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user) return;

    // 1️⃣ LOAD PROFILE + ENSURE REFERRAL CODE EXISTS
    const { data: profile } = await supabase
      .from("profiles")
      .select("referral_code")
      .eq("id", user.id)
      .single();

    let code = profile?.referral_code;

    if (!code) {
      const newCode = generateReferralCode();

      const { error } = await supabase
        .from("profiles")
        .update({ referral_code: newCode })
        .eq("id", user.id);

      if (!error) {
        code = newCode;
      }
    }

    setReferralCode(code || "");

    // 2️⃣ LOAD STATS
    const { data: referrals } = await supabase
      .from("referrals")
      .select("paid")
      .eq("referrer_id", user.id);

    const total = referrals?.length || 0;
    const paid = referrals?.filter((r) => r.paid).length || 0;

    setStats({
      total,
      paid,
      unpaid: total - paid,
    });

    setLoading(false);
  }

  async function loadList(paidStatus) {
    setFilterPaid(paidStatus);

    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user) return;

    const { data } = await supabase
      .from("referrals")
      .select(`
        paid,
        created_at,
        profiles:referred_user_id (
          full_name,
          email
        )
      `)
      .eq("referrer_id", user.id)
      .eq("paid", paidStatus);

    setList(data || []);
  }

  return (
    <ProviderLayout>
      <div className="min-h-screen bg-[#eef1f6]">
        <main className="flex-1 px-6 py-6">
          <ProviderHeader />

          <div className="mb-6">
            <h2 className="text-xl font-bold text-[#0b1220]">
              Referral Program
            </h2>
            <p className="text-sm text-gray-500">
              Invite other providers and track who has activated.
            </p>
          </div>

          {/* REFERRAL LINK */}
          <div className="bg-white p-4 rounded-3xl shadow border mb-6">
            <div className="text-xs text-gray-500 mb-1">
              Your referral link
            </div>
            <div className="flex gap-2">
              <input
                readOnly
                value={`https://app.servnect.com/signup-auth/choose-role?ref=${referralCode}`}
                className="flex-1 border rounded-xl px-4 py-3 text-sm"
              />
              <button
                onClick={() =>
                  navigator.clipboard.writeText(
                    `https://app.servnect.com/signup-auth/choose-role?ref=${referralCode}`
                  )
                }
                className="px-5 py-3 rounded-xl bg-[#0b1220] text-white text-sm font-semibold"
              >
                Copy
              </button>
            </div>
          </div>

          {/* STATS */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-4 rounded-2xl border">
              <div className="text-xs text-gray-500">Total Signups</div>
              <div className="text-2xl font-bold">
                {loading ? "…" : stats.total}
              </div>
            </div>

            <div
              onClick={() => loadList(true)}
              className="bg-white p-4 rounded-2xl border cursor-pointer hover:bg-gray-50"
            >
              <div className="text-xs text-gray-500">Paid</div>
              <div className="text-2xl font-bold">
                {loading ? "…" : stats.paid}
              </div>
            </div>

            <div
              onClick={() => loadList(false)}
              className="bg-white p-4 rounded-2xl border cursor-pointer hover:bg-gray-50"
            >
              <div className="text-xs text-gray-500">Unpaid</div>
              <div className="text-2xl font-bold">
                {loading ? "…" : stats.unpaid}
              </div>
            </div>
          </div>

          {/* LIST */}
          {filterPaid !== null && (
            <div className="bg-white rounded-3xl shadow border overflow-hidden">
              <div className="px-5 py-4 font-semibold border-b">
                {filterPaid ? "Paid Referrals" : "Unpaid Referrals"}
              </div>

              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-5 py-3">Name</th>
                    <th className="text-left px-5 py-3">Email</th>
                    <th className="text-left px-5 py-3">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((r, i) => (
                    <tr key={i} className="border-t">
                      <td className="px-5 py-3">
                        {r.profiles?.full_name || "—"}
                      </td>
                      <td className="px-5 py-3">
                        {r.profiles?.email || "—"}
                      </td>
                      <td className="px-5 py-3">
                        {new Date(r.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}

                  {list.length === 0 && (
                    <tr>
                      <td
                        colSpan="3"
                        className="px-5 py-6 text-center text-gray-500"
                      >
                        No referrals found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
    </ProviderLayout>
  );
}

export default function ProviderReferrals() {
  return (
    <RequireRole role="provider">
      <ProviderReferralsContent />
    </RequireRole>
  );
}