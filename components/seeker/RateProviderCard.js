// 🔒 AUTH LOCKED – DO NOT MODIFY AUTH LOGIC
// Seeker → Rate Provider (Stars UI)
// Optional, single-submit, DB-enforced rules

import { useState } from "react";
import { Star } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

export default function RateProviderCard({ job, providerName, onRated }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [review, setReview] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const safeName =
    providerName && !String(providerName).includes("@")
      ? providerName
      : "Provider";

  async function submitRating() {
    if (!rating || loading) return;

    setLoading(true);

    const { error } = await supabase.from("ratings").insert({
      job_id: job.id,
      seeker_id: job.seeker_id,
      provider_id: job.provider_id,
      rating,
      review: review.trim() || null,
    });

    setLoading(false);

    if (error) {
      alert("Rating failed. This job may already be rated.");
      return;
    }

    setSubmitted(true);
    onRated?.();
  }

  if (submitted) {
    return (
      <div className="mt-6 bg-white rounded-2xl p-6 border text-center">
        <p className="text-sm font-semibold text-gray-600">
          ✅ Thanks for rating {safeName}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 bg-white rounded-3xl p-6 border shadow">
      <h3 className="text-lg font-bold text-[#0B1220]">
        Rate {safeName}
      </h3>

      <p className="text-sm text-gray-500 mt-1">
        This helps improve service quality. Optional.
      </p>

      {/* STARS */}
      <div className="flex gap-2 mt-4">
        {[1, 2, 3, 4, 5].map((v) => (
          <button
            key={v}
            onMouseEnter={() => setHover(v)}
            onMouseLeave={() => setHover(0)}
            onClick={() => setRating(v)}
          >
            <Star
              size={28}
              className={
                (hover || rating) >= v
                  ? "fill-[#e5e7eb] text-[#e5e7eb]"
                  : "text-gray-300"
              }
            />
          </button>
        ))}
      </div>

      {/* REVIEW */}
      <textarea
        value={review}
        onChange={(e) => setReview(e.target.value)}
        placeholder="Optional review..."
        className="mt-4 w-full rounded-xl border px-4 py-3 text-sm outline-none"
      />

      {/* ACTION */}
      <div className="mt-4 flex justify-end">
        <button
          onClick={submitRating}
          disabled={!rating || loading}
          className={`px-5 py-3 rounded-xl text-sm font-semibold
            ${
              rating
                ? "bg-[#0B1220] text-white"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
        >
          Submit rating
        </button>
      </div>
    </div>
  );
}