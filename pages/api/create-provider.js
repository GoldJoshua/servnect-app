import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // server only
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { user_id, email, referral_code } = req.body;

  let field_agent_id = null;

  // 1️⃣ Resolve referral code → field agent
  if (referral_code) {
    const { data } = await supabase
      .from("field_agent_referrals")
      .select("field_agent_id")
      .eq("referral_code", referral_code)
      .single();

    field_agent_id = data?.field_agent_id ?? null;
  }

  // 2️⃣ Create provider
  const { error } = await supabase.from("providers").insert({
    user_id,
    email,
    field_agent_id,
    activation_status: "pending",
  });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ success: true });
}