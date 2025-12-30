// pages/provider/support.js
// 🔒 AUTH LOCKED – DO NOT MODIFY AUTH LOGIC

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import RequireRole from "../../components/auth/RequireRole";
import { supabase } from "../../lib/supabaseClient";

import ProviderLayout from "../../components/layouts/ProviderLayout";
import ProviderHeader from "../../components/provider/ProviderHeader";

function ProviderSupportContent() {
  const router = useRouter();

  const [name, setName] = useState("Provider");
  const [category, setCategory] = useState("general");
  const [priority, setPriority] = useState("medium");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", user.id)
        .single();

      if (profile?.name) {
        setName(profile.name.split(" ")[0]);
      }
    }

    loadProfile();
  }, []);

  async function submitTicket() {
    if (!message.trim()) return;

    setSending(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    const { data, error } = await supabase
      .from("support_tickets")
      .insert({
        provider_id: user.id,
        category,
        priority,
        status: "open",
      })
      .select("id")
      .single();

    if (error || !data) {
      console.error("Ticket creation failed:", error);
      alert("Failed to create ticket. Please try again.");
      setSending(false);
      return;
    }

    // Insert first message
    await supabase.from("support_messages").insert({
      ticket_id: data.id,
      sender_role: "provider",
      sender_id: user.id,
      message,
    });

    router.push(`/provider/support/${data.id}`);
  }

  return (
    <ProviderLayout>
      <div className="min-h-screen bg-[#eef1f6]">
        <main className="flex-1 px-6 py-6">
          <ProviderHeader name={name} />

          <div className="mb-6">
            <h2 className="text-xl font-bold text-[#0b1220]">Support</h2>
            <p className="text-sm text-gray-500">
              Contact support for job, payment, or account issues.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 shadow border max-w-2xl">
            {/* CATEGORY */}
            <div className="mb-4">
              <label className="text-xs text-gray-500 block mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border px-4 py-3 text-sm"
              >
                <option value="general">General</option>
                <option value="payment">Payment</option>
                <option value="job">Job / Dispute</option>
                <option value="account">Account</option>
              </select>
            </div>

            {/* PRIORITY */}
            <div className="mb-4">
              <label className="text-xs text-gray-500 block mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full rounded-xl border px-4 py-3 text-sm"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            {/* MESSAGE */}
            <div className="mb-6">
              <label className="text-xs text-gray-500 block mb-1">
                Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                placeholder="Describe the issue in detail..."
                className="w-full rounded-xl border px-4 py-3 text-sm"
              />
            </div>

            <div className="flex justify-end">
              <button
                onClick={submitTicket}
                disabled={sending}
                className={`px-6 py-3 rounded-xl text-sm font-semibold text-white ${
                  sending
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-[#0b1220]"
                }`}
              >
                {sending ? "Submitting..." : "Submit Ticket"}
              </button>
            </div>
          </div>
        </main>
      </div>
    </ProviderLayout>
  );
}

export default function ProviderSupport() {
  return (
    <RequireRole role="provider">
      <ProviderSupportContent />
    </RequireRole>
  );
}