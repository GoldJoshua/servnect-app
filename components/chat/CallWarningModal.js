import { PhoneOff, AlertTriangle } from "lucide-react";

export default function CallWarningModal({ open, onClose, onProceed }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-10 w-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center">
            <AlertTriangle size={18} className="text-amber-600" />
          </div>
          <div>
            <div className="text-sm font-semibold text-[#0b1220]">
              Call warning
            </div>
            <div className="text-[12px] text-gray-500">
              Off-platform calls can be risky.
            </div>
          </div>
        </div>

        <div className="text-[13px] text-gray-600 leading-relaxed">
          If you call off-platform, ServiceConnect may not be liable for disputes,
          theft, poor workmanship, or unresolved issues. For protection and
          warranty benefits, keep conversations and payments inside the platform.
        </div>

        <div className="mt-5 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-sm"
          >
            Cancel
          </button>
          <button
            onClick={onProceed}
            className="flex-1 py-3 rounded-xl bg-[#0b1220] text-white text-sm inline-flex items-center justify-center gap-2"
          >
            <PhoneOff size={16} />
            Proceed anyway
          </button>
        </div>
      </div>
    </div>
  );
}