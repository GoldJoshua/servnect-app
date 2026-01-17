import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function generateReferralCode() {
  return "FA-" + Math.random().toString(36).substring(2, 8).toUpperCase();
}

serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { status: 405 }
      );
    }

    const { field_agent_id } = await req.json();

    if (!field_agent_id) {
      return new Response(
        JSON.stringify({ error: "field_agent_id is required" }),
        { status: 400 }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1️⃣ Check if referral already exists
    let { data, error } = await supabase
      .from("field_agent_referrals")
      .select("referral_code")
      .eq("field_agent_id", field_agent_id)
      .single();

    let referralCode = data?.referral_code;

    // 2️⃣ Create referral if missing
    if (!referralCode) {
      referralCode = generateReferralCode();

      const { error: insertError } = await supabase
        .from("field_agent_referrals")
        .insert({
          field_agent_id,
          referral_code: referralCode,
        });

      if (insertError) {
        return new Response(
          JSON.stringify({ error: "Failed to create referral record" }),
          { status: 500 }
        );
      }
    }

    // 3️⃣ Return link
    return new Response(
      JSON.stringify({
        referral_code: referralCode,
        referral_url: `https://app.servnect.com/signup-auth/choose-role?ref=${referralCode}`,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch {
    return new Response(
      JSON.stringify({ error: "Unexpected server error" }),
      { status: 500 }
    );
  }
});