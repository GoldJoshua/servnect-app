import { useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

export default function ForceLogout() {
  useEffect(() => {
    async function doLogout() {
      await supabase.auth.signOut();
      window.location.href = "/login";
    }
    doLogout();
  }, []);

  return <p style={{ padding: 20 }}>Signing you out…</p>;
}