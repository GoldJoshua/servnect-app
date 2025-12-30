// 🔒 AUTH LOCKED – DO NOT MODIFY
// This file controls authentication & routing logic.
// Changes here can break login/signup flows.
// // lib/supabaseClient.js
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(url, anon);