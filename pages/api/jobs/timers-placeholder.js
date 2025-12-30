export default function handler(req, res) {
  // Placeholder endpoint.
  // Later: connect this to a Supabase Edge Function or a cron job
  // that checks pending jobs older than X minutes and reassigns.
  return res.status(200).json({
    ok: true,
    message: "Timers placeholder ready. Implement with cron/edge function next.",
  });
}