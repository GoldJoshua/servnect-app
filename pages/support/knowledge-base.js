import { useState } from "react";
import SupportLayout from "../../components/support/SupportLayout";

export default function KnowledgeBase() {
  const [query, setQuery] = useState("");

  const articles = [
    { id: "KB-1", title: "How to process refunds", tag: "Payments" },
    { id: "KB-2", title: "How to verify documents", tag: "Verification" },
    { id: "KB-3", title: "Troubleshooting login issues", tag: "Auth" },
  ];

  const filtered = articles.filter((a) =>
    (a.title + " " + a.tag).toLowerCase().includes(query.toLowerCase())
  );

  return (
    <SupportLayout>
      <div className="p-6">
        <h1 className="text-2xl font-black">Knowledge Base</h1>
        <p className="text-sm text-black/60 mt-1">
          Articles on common support tasks. If you can’t find an answer, flag it for admin updates.
        </p>

        <div className="mt-6 flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search articles..."
            className="flex-1 max-w-xl border border-black/15 rounded-xl px-4 py-3 text-sm outline-none"
          />
          <button className="px-4 py-3 rounded-xl bg-black text-white text-sm font-black">
            New Article
          </button>
        </div>

        <div className="mt-6 bg-white border border-black/10 rounded-2xl overflow-hidden">
          {filtered.map((a) => (
            <div
              key={a.id}
              className="p-5 border-b border-black/5 hover:bg-black/5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-black">{a.title}</div>
                  <div className="text-xs text-black/60 mt-1">{a.tag}</div>
                </div>

                <button
                  onClick={() => alert("Flagged for admin to update KB (coming next).")}
                  className="px-3 py-2 rounded-xl border border-black/15 text-xs font-black hover:bg-black/5"
                >
                  Flag for Admin
                </button>
              </div>
            </div>
          ))}

          {filtered.length === 0 ? (
            <div className="p-10 text-sm text-black/60">No articles found.</div>
          ) : null}
        </div>
      </div>
    </SupportLayout>
  );
}