import { useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

export default function useAuthListener() {
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("AUTH EVENT:", event);
        console.log("SESSION:", session);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);
}