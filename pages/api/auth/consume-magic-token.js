import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

/**
 * 🔐 CONSUME MAGIC LOGIN TOKEN
 *
 * This API:
 * - Validates a one-time magic token
 * - Creates a REAL Supabase session (official way)
 * - Marks token as used
 * - Returns success
 *
 * ⚠️ Uses SERVICE ROLE KEY (server-only)
 * ⚠️ Does NOT affect website logic, payments, or subscriptions
 */

// ❗ SERVICE ROLE CLIENT (SERVER ONLY)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).end("Method not allowed");
  }

  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: "Missing token" });
    }

    // Hash incoming token
    const tokenHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // Find valid, unused token
    const { data: row, error } = await supabaseAdmin
      .from("magic_login_tokens")
      .select("*")
      .eq("token_hash", tokenHash)
      .is("used_at", null)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (error || !row) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    // Mark token as used
    await supabaseAdmin
      .from("magic_login_tokens")
      .update({ used_at: new Date().toISOString() })
      .eq("id", row.id);

    // 🔑 Create REAL Supabase session
    const { data, error: sessionError } =
      await supabaseAdmin.auth.admin.createSession({
        userId: row.profile_id,
      });

    if (sessionError || !data?.session) {
      return res.status(500).json({ error: "Failed to create session" });
    }

    const { access_token, refresh_token } = data.session;

    // ✅ Set Supabase cookies (official format)
    res.setHeader("Set-Cookie", [
      `sb-access-token=${access_token}; Path=/; HttpOnly; Secure; SameSite=Lax`,
      `sb-refresh-token=${refresh_token}; Path=/; HttpOnly; Secure; SameSite=Lax`,
    ]);

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("consume-magic-token error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}