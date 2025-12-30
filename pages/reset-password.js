// pages/reset-password.js
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/router";

export default function ResetPassword() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // 🔐 BLOCK guards by validating recovery session
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data?.session) {
        router.replace("/login");
      }
    });
  }, [router]);

  async function handleUpdate(e) {
    e.preventDefault();
    setLoading(true);
    setMsg("");

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setMsg(error.message);
      setLoading(false);
      return;
    }

    setMsg("Password updated. Redirecting to login…");

    // ✅ FORCE LOGOUT so guards don't hijack
    await supabase.auth.signOut();

    setTimeout(() => {
      router.replace("/login");
    }, 1200);
  }

  return (
    <div style={{ maxWidth: 520, margin: "48px auto" }}>
      <h2>Create a new password</h2>

      <form onSubmit={handleUpdate}>
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          placeholder="New password"
          type="password"
          style={{ width: "100%", padding: 10, marginBottom: 10 }}
        />

        <button
          disabled={loading || password.length < 6}
          type="submit"
          style={{ width: "100%", padding: 10 }}
        >
          {loading ? "Updating…" : "Update password"}
        </button>
      </form>

      {msg && <p style={{ marginTop: 8 }}>{msg}</p>}
    </div>
  );
}