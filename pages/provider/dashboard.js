// 🔒 AUTH LOCKED – DO NOT MODIFY
// This page is protected by RequireRole (provider only).
// UI changes are allowed. Auth logic must stay in RequireRole.

import { useEffect, useState } from "react";
import RequireRole from "../../components/auth/RequireRole";
import { supabase } from "../../lib/supabaseClient";

import ProviderLayout from "../../components/layouts/ProviderLayout";

import ProviderHeader from "../../components/provider/ProviderHeader";
import StatCard from "../../components/provider/StatCard";
import JobRequestCard from "../../components/provider/JobRequestCard";
import SubscriptionCard from "../../components/provider/SubscriptionCard";

function ProviderDashboardContent() {
  const [name, setName] = useState("");
  const [myJobs, setMyJobs] = useState([]);
  const [availableJobs, setAvailableJobs] = useState([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [rating, setRating] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [subscriptionPlan, setSubscriptionPlan] = useState("free");
  const [jobsThisMonth, setJobsThisMonth] = useState(0);
  const [activationPaid, setActivationPaid] = useState(false);

  useEffect(() => {
    async function loadProvider() {
      setLoadingStats(true);
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;
      if (!user) return;

      await supabase.rpc("ensure_provider_row");

      const { data: profile } = await supabase
        .from("profiles")
        .select("name, subscription_plan, activation_paid")
        .eq("id", user.id)
        .single();

      if (profile?.name) setName(profile.name.split(" ")[0]);
      setSubscriptionPlan(profile?.subscription_plan || "free");
      setActivationPaid(profile?.activation_paid === true);

      const { data: wallet } = await supabase
        .from("wallets")
        .select("balance")
        .eq("user_id", user.id)
        .single();

      setWalletBalance(wallet?.balance || 0);

      const { data: provider } = await supabase
        .from("providers")
        .select("rating")
        .eq("user_id", user.id)
        .single();

      setRating(provider?.rating ? provider.rating.toFixed(1) : "—");

      const { data: assignedJobs } = await supabase
        .from("jobs")
        .select("*")
        .eq("provider_id", user.id)
        .order("created_at", { ascending: false });

      setMyJobs(assignedJobs || []);

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: monthlyJobs } = await supabase
        .from("jobs")
        .select("id")
        .eq("provider_id", user.id)
        .gte("accepted_at", startOfMonth.toISOString());

      setJobsThisMonth(monthlyJobs?.length || 0);

      const { data: openJobs } = await supabase
        .from("jobs")
        .select("*")
        .is("provider_id", null)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      setAvailableJobs(openJobs || []);
      setLoadingStats(false);
    }

    loadProvider();
  }, []);

  async function acceptJob(jobId) {
    if (!activationPaid) {
      alert("Activation required. Please pay the ₦2,500 activation fee.");
      return;
    }

    if (subscriptionPlan === "free" && jobsThisMonth >= 2) {
      alert(
        "FREE PLAN LIMIT REACHED\n\n" +
          "• Max 1 job until subscription upgrade\n" +
          "• Upgrade to accept more jobs"
      );
      return;
    }

    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user) return;

    const { error } = await supabase
      .from("jobs")
      .update({
        provider_id: user.id,
        status: "accepted",
        accepted_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    if (!error) {
      setAvailableJobs((prev) => prev.filter((j) => j.id !== jobId));
      setJobsThisMonth((n) => n + 1);
    }
  }

  const handlePayActivationFee = async () => {
    alert("Payment successful! Your account is now activated.");
    setActivationPaid(true);
  };

  return (
    <ProviderLayout activationPaid={activationPaid}>
      <div className="min-h-screen bg-[#eef1f6]">
        <main className="flex-1 px-6 py-6">
          <ProviderHeader name={name} />

          {!activationPaid && (
            <div className="mb-4 bg-red-50 border border-red-300 rounded-2xl p-4 text-sm">
              <div className="font-semibold text-red-800">
                Activate your provider account
              </div>
              <p className="mt-1 text-red-700">
                A one-time <b>₦2,500 activation fee</b> is required to access jobs
                and dashboard features.
              </p>
              <button
                onClick={handlePayActivationFee}
                className="mt-3 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-semibold"
              >
                Pay ₦2,500 Now
              </button>
            </div>
          )}

          {activationPaid && subscriptionPlan === "free" && (
            <div className="mb-4 bg-yellow-50 border border-yellow-300 rounded-2xl p-4 text-sm">
              <div className="font-semibold text-yellow-800">
                You are currently on the FREE plan
              </div>
              <ul className="mt-2 text-yellow-700 list-disc list-inside">
                <li>Maximum <b>1 job until subscription upgrade</b></li>
                <li>Your profile appears last in search results</li>
              </ul>
            </div>
          )}

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              title="Wallet Balance"
              value={`₦${walletBalance.toLocaleString()}`}
              loading={loadingStats}
              accent
            />
            <StatCard
              title="Jobs This Month"
              value={jobsThisMonth}
              loading={loadingStats}
            />
            <StatCard
              title="My Jobs"
              value={myJobs.length}
              loading={loadingStats}
            />
            <StatCard
              title="Rating"
              value={rating}
              loading={loadingStats}
            />
          </div>

          <SubscriptionCard activationPaid={activationPaid} />

          <h2 className="mt-6 mb-3 text-sm font-semibold">Available Jobs</h2>
          {availableJobs.map((job) => (
            <div
              key={job.id}
              className="bg-white p-4 rounded-2xl border flex justify-between"
            >
              <div>
                <div className="font-semibold">{job.service_title}</div>
                <div className="text-xs text-gray-500">{job.address}</div>
              </div>
              <button
                disabled={!activationPaid}
                onClick={() => acceptJob(job.id)}
                className={`px-4 py-2 rounded-xl text-xs ${
                  activationPaid
                    ? "bg-[#0b1220] text-white"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                {activationPaid ? "Accept Job" : "Activation Required"}
              </button>
            </div>
          ))}

          <h2 className="mt-8 mb-3 text-sm font-semibold">My Jobs</h2>
          {myJobs.map((job) => (
            <JobRequestCard key={job.id} job={job} />
          ))}
        </main>
      </div>
    </ProviderLayout>
  );
}

export default function ProviderDashboard() {
  return (
    <RequireRole role="provider">
      <ProviderDashboardContent />
    </RequireRole>
  );
}