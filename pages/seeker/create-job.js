// pages/seeker/create-job.js
// 🔒 AUTH LOCKED – DO NOT MODIFY AUTH LOGIC
// Seeker job creation – DIRECT JOB CREATION (NO ESCROW, NO PAYMENT GATING)

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import RequireRole from "../../components/auth/RequireRole";
import { supabase } from "../../lib/supabaseClient";

export default function CreateJobPage() {
  const router = useRouter();

  const [contextLoaded, setContextLoaded] = useState(false);
  const [providerId, setProviderId] = useState(null);
  const [subcategoryName, setSubcategoryName] = useState(null);

  const [serviceTitle, setServiceTitle] = useState("");
  const [address, setAddress] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [notes, setNotes] = useState("");
  const [budget, setBudget] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ─────────────────────────────────────────────
  // LOAD JOB CONTEXT
  // ─────────────────────────────────────────────
  useEffect(() => {
    const stored = localStorage.getItem("create_job_context");

    if (!stored) {
      setError("Invalid job request. Please select a provider again.");
      return;
    }

    try {
      const parsed = JSON.parse(stored);

      if (!parsed.provider || !parsed.subcategory) {
        setError("Invalid job request. Please select a provider again.");
        return;
      }

      setProviderId(parsed.provider);
      setSubcategoryName(parsed.subcategory);
      setContextLoaded(true);
    } catch {
      setError("Invalid job request. Please select a provider again.");
    }
  }, []);

  async function submitJob(e) {
    e.preventDefault();
    setError("");

    if (!contextLoaded || !providerId) {
      setError("Invalid job request. Please select a provider again.");
      return;
    }

    if (!serviceTitle || !address) {
      setError("Service title and address are required.");
      return;
    }

    if (!budget || Number(budget) <= 0) {
      setError("A valid estimated workmanship amount is required.");
      return;
    }

    setLoading(true);

    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;

    if (!user) {
      setError("You must be logged in.");
      setLoading(false);
      return;
    }

    const { data: job, error: insertError } = await supabase
      .from("jobs")
      .insert({
        seeker_id: user.id,
        provider_id: providerId,
        status: "pending",
        service_title: serviceTitle,
        service: subcategoryName,
        address,
        scheduled_at: scheduledAt || null,
        notes: notes || null,
        budget: Number(budget),
      })
      .select()
      .single();

    if (insertError || !job?.id) {
      console.error(insertError);
      setError("Failed to create job.");
      setLoading(false);
      return;
    }

    localStorage.removeItem("create_job_context");
    router.push(`/seeker/jobs/${job.id}`);
  }

  return (
    <RequireRole role="seeker">
      <div className="min-h-screen flex items-center justify-center bg-[#eef1f6] px-4">
        <form
          onSubmit={submitJob}
          className="w-full max-w-xl bg-white rounded-3xl p-10 shadow border"
        >
          <h1 className="text-2xl font-bold text-[#0b1220]">
            Create a Job Request
          </h1>

          <div className="mt-6">
            <label className="text-xs text-gray-500">Service Title</label>
            <input
              value={serviceTitle}
              onChange={(e) => setServiceTitle(e.target.value)}
              className="mt-1 w-full p-4 rounded-xl border outline-none"
            />
          </div>

          <div className="mt-4">
            <label className="text-xs text-gray-500">Service Address</label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="mt-1 w-full p-4 rounded-xl border outline-none"
            />
          </div>

          <div className="mt-4">
            <label className="text-xs text-gray-500">Preferred Date</label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="mt-1 w-full p-4 rounded-xl border outline-none"
            />
          </div>

          <div className="mt-4">
            <label className="text-xs text-gray-500">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="mt-1 w-full p-4 rounded-xl border outline-none"
            />
          </div>

          <div className="mt-4">
            <label className="text-xs text-gray-500">
              Estimated Workmanship (₦)
            </label>
            <input
              type="number"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="mt-1 w-full p-4 rounded-xl border outline-none"
            />
          </div>

          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className={`mt-6 w-full py-4 rounded-xl font-semibold text-white ${
              loading ? "bg-gray-300" : "bg-[#0b1220]"
            }`}
          >
            {loading ? "Submitting..." : "Submit Job Request"}
          </button>
        </form>
      </div>
    </RequireRole>
  );
}