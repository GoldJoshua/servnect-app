// components/support/TicketActions.js
// UI-only ticket controls (status & priority)
// No auth logic here

import { useState } from "react";

const STATUSES = [
  { key: "open", label: "Open" },
  { key: "in_progress", label: "In Progress" },
  { key: "resolved", label: "Resolved" },
];

const PRIORITIES = [
  { key: "low", label: "Low" },
  { key: "medium", label: "Medium" },
  { key: "high", label: "High" },
  { key: "critical", label: "Critical" },
];

export default function TicketActions({
  status,
  priority,
  onSetStatus,
  onSetPriority,
}) {
  const [saving, setSaving] = useState(false);

  function updateStatus(value) {
    setSaving(true);
    onSetStatus(value);
    setTimeout(() => setSaving(false), 400);
  }

  function updatePriority(value) {
    setSaving(true);
    onSetPriority(value);
    setTimeout(() => setSaving(false), 400);
  }

  return (
    <div className="bg-white border border-black/10 rounded-2xl p-5">
      <h3 className="text-sm font-black mb-4">Ticket Actions</h3>

      {/* STATUS */}
      <div className="mb-5">
        <div className="text-xs font-black mb-2">Status</div>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <button
              key={s.key}
              onClick={() => updateStatus(s.key)}
              disabled={saving}
              className={`px-4 py-2 rounded-xl text-xs font-black border transition
                ${
                  status === s.key
                    ? "bg-black text-white border-black"
                    : "bg-white text-black border-black/20 hover:bg-black/5"
                }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* PRIORITY */}
      <div>
        <div className="text-xs font-black mb-2">Priority</div>
        <div className="flex flex-wrap gap-2">
          {PRIORITIES.map((p) => (
            <button
              key={p.key}
              onClick={() => updatePriority(p.key)}
              disabled={saving}
              className={`px-4 py-2 rounded-xl text-xs font-black border transition
                ${
                  priority === p.key
                    ? "bg-black text-white border-black"
                    : "bg-white text-black border-black/20 hover:bg-black/5"
                }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {saving && (
        <div className="mt-4 text-xs text-black/60">
          Saving changes…
        </div>
      )}
    </div>
  );
}