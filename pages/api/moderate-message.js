import { supabase } from "../../lib/supabaseClient";

const PHONE_REGEX =
  /(\+?\d{1,3}[\s-]?)?(\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}/;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { text, jobId } = req.body;

  if (!text || !jobId) {
    return res.status(400).json({ allowed: false });
  }

  // 1️⃣ Load job status
  const { data: job, error } = await supabase
    .from("jobs")
    .select("status")
    .eq("id", jobId)
    .single();

  if (error || !job) {
    return res.status(403).json({
      allowed: false,
      reason: "Invalid job",
    });
  }

  // 2️⃣ If phone number detected
  if (PHONE_REGEX.test(text)) {
    // ❌ BLOCK unless accepted
    if (job.status !== "accepted") {
      return res.json({
        allowed: false,
        reason:
          "Phone numbers can only be shared after the provider accepts the job.",
      });
    }
  }

  // ✅ Allowed
  return res.json({ allowed: true });
}