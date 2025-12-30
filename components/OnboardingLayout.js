// components/OnboardLayout.js
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import MotionDiv from "./MotionDiv";

export default function OnboardLayout({
  children,
  step = 1,
  stepsTotal = 5,
  progress = 0.2, // 0..1
  showBack = true,
}) {
  const pct = Math.min(Math.max(progress, 0), 1) * 100;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-zinc-50 px-4">
      <div className="max-w-7xl w-full grid grid-cols-12 gap-8">
        {/* Left card (ServiceConnect) */}
        <div className="col-span-5 flex items-center justify-center">
          <MotionDiv className="w-80 p-8 rounded-2xl bg-white shadow-xl">
            <div className="text-2xl font-extrabold tracking-tight">ServiceConnect</div>
            <p className="text-sm text-gray-500 mt-2">Find trusted professionals. Book with confidence.</p>
          </MotionDiv>
        </div>

        {/* Right panel */}
        <div className="col-span-7 flex items-start justify-center">
          <div className="w-full max-w-2xl">
            <div className="flex items-center justify-between mb-4">
              {showBack ? (
                <Link href="/signup-auth/choose-role" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900">
                  <ChevronLeft size={18} /> Back
                </Link>
              ) : <div/>}
              <div className="text-sm text-gray-400">Step {step} of {stepsTotal}</div>
            </div>

            {/* progress bar */}
            <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden mb-6">
              <div className="h-2 rounded-full bg-[#0b1220]" style={{ width: `${pct}%` }} />
            </div>

            {/* content card */}
            <MotionDiv
              className="bg-white rounded-2xl shadow-2xl p-10 border border-gray-100"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {children}
            </MotionDiv>
          </div>
        </div>
      </div>
    </div>
  );
}