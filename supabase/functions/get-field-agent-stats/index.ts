import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const COMMISSION_PER_PROVIDER = 500;

// Helpers
const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
};

const startOfWeek = () => {
  const d = new Date();
  const day = d.getDay(); // 0 = Sunday
  const diff = (day === 0 ? -6 : 1) - day; // Monday start
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
};

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

    // 1️⃣ Fetch all providers for this agent (include activation_paid)
    const { data: providers, error: providersError } = await supabase
      .from("providers")
      .select(`
        id,
        created_at,
        profiles (
          activation_paid
        )
      `)
      .eq("field_agent_id", field_agent_id);

    if (providersError) {
      throw providersError;
    }

    const totalProviders = providers.length;

    // 2️⃣ Activated providers (SOURCE OF TRUTH: profiles.activation_paid)
    const activatedProviders = providers.filter(
      (p) => p.profiles?.activation_paid === true
    ).length;

    const pendingProviders = totalProviders - activatedProviders;
    const totalCommission = activatedProviders * COMMISSION_PER_PROVIDER;

    // 3️⃣ Daily / Weekly counts (based on provider creation)
    const todayStart = startOfToday();
    const weekStart = startOfWeek();

    const dailyProviders = providers.filter(
      (p) => p.created_at >= todayStart
    ).length;

    const weeklyProviders = providers.filter(
      (p) => p.created_at >= weekStart
    ).length;

    // 4️⃣ Final response
    return new Response(
      JSON.stringify({
        field_agent_id,
        total_providers: totalProviders,
        activated_providers: activatedProviders,
        pending_providers: pendingProviders,
        daily_providers: dailyProviders,
        weekly_providers: weeklyProviders,
        total_commission: totalCommission,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Stats error:", err);
    return new Response(
      JSON.stringify({ error: "Unexpected server error" }),
      { status: 500 }
    );
  }
});