// 🔒 AUTH LOCKED – DO NOT MODIFY
// This page is protected by RequireRole (seeker only).
// UI changes are allowed. Auth logic must stay in RequireRole.
// pages/seeker/dashboard.js

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { motion } from "framer-motion";
import {
  MapPin,
  CreditCard,
  CalendarDays,
  Clock,
  Users,
  ArrowRight,
  Star,
} from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import RequireRole from "../../components/auth/RequireRole";
import SeekerLayout from "../../components/layouts/SeekerLayout";

function SeekerDashboard() {
  const router = useRouter();
  const [name, setName] = useState("there");
  const [profile, setProfile] = useState(null);
  const [profileCompletion, setProfileCompletion] = useState(45);

  // ADDED – realtime providers nearby count
  const [providersNearbyCount, setProvidersNearbyCount] = useState(0);
  // ADDED – disable premium providers for now
  const showPremiumProviders = false;

  const [stats] = useState({
    walletBalance: "₦0.00",
    bookingsThisMonth: 0,
    upcomingAppointments: 0,
    providersNearby: 12,
  });

  useEffect(() => {
    async function loadProfile() {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth?.user;

      if (!user) return;

      const { data: dbProfile, error } = await supabase
        .from("profiles")
        .select("name, role, state")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Profile fetch error:", error);
      }

      if (dbProfile) {
        setProfile(dbProfile);

        if (dbProfile?.state) {
          const { count, error: countError } = await supabase
            .from("profiles")
            .select("id", { count: "exact", head: true })
            .eq("role", "provider")
            .eq("state", dbProfile.state);

          if (countError) {
            console.error("Providers nearby count error:", countError);
            setProvidersNearbyCount(0);
          } else {
            setProvidersNearbyCount(count || 0);
          }
        }

        if (dbProfile.name && !dbProfile.name.includes("@")) {
          const first = dbProfile.name.split(" ")[0];
          setName(first);
        } else {
          if (typeof window !== "undefined") {
            const savedName =
              localStorage.getItem("signup_name") ||
              localStorage.getItem("provider_name");

            if (savedName && !savedName.includes("@")) {
              const first = savedName.split(" ")[0];
              setName(first);
            } else {
              setName("there");
            }
          }
        }
      } else {
        if (typeof window !== "undefined") {
          const savedName =
            localStorage.getItem("signup_name") ||
            localStorage.getItem("provider_name");
          if (savedName) {
            const first = savedName.split(" ")[0];
            setName(first);
          }
        }
      }
    }

    loadProfile();
  }, [router]);

  function handleBookService() {
    router.push("/seeker/find");
  }

  return (
    <SeekerLayout>
      <div className="min-h-screen bg-[#eef1f6]">
        {/* MAIN AREA */}
        <div className="flex-1 flex flex-col min-h-screen">
          {/* TOP BAR (mobile only) */}
          <header
            className="lg:hidden flex items-center justify-between px-4 py-3
                     bg-gradient-to-r from-[#0b1220] to-[#3b485f]
                     text-white shadow-md"
          >
            <div className="flex items-center gap-2">
              {/* (hamburger removed — sidebar retired) */}
              <div className="h-8 w-8 rounded-xl bg-white/10 flex items-center justify-center">
                <span className="text-xs font-bold">SC</span>
              </div>
              <div>
                <div className="text-sm font-semibold">ServiceConnect</div>
                <div className="text-[11px] text-white/70">
                  Client Dashboard
                </div>
              </div>
            </div>
          </header>

          {/* MAIN CONTENT */}
          <main className="flex-1 px-4 lg:px-8 py-6 lg:py-8 overflow-y-auto">
            {/* GREETING + QUICK ACTIONS */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mb-6 lg:mb-8"
            >
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl lg:text-3xl font-bold text-[#0b1220]">
                      Hello, {name} 👋
                    </h1>
                    <span
                      className="px-3 py-1 rounded-full text-[11px] font-semibold
                               bg-[#0b1220] text-white tracking-wide"
                    >
                      CLIENT
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    Here’s what’s happening today. You can quickly book trusted
                    services around you.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleBookService}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold
                             bg-gradient-to-r from-[#0b1220] to-[#3b485f]
                             text-white shadow-lg shadow-[#0b1220]/30"
                  >
                    Book Service
                    <ArrowRight size={16} />
                  </button>
                  <button
                    onClick={() => router.push("/seeker/wallet")}
                    className="inline-flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-medium
                             bg-white text-[#0b1220] border border-gray-200 shadow-sm"
                  >
                    <CreditCard size={14} />
                    View Wallet
                  </button>
                </div>
              </div>
            </motion.div>

            {/* TOP ROW: MAP + PROFILE COMPLETION */}
            <div className="grid lg:grid-cols-3 gap-5 mb-6 lg:mb-8">
              {/* MAP PLACEHOLDER */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.05 }}
                className="lg:col-span-2 bg-gradient-to-br from-[#0b1220] via-[#1f2937] to-[#3b485f]
                         rounded-3xl p-5 lg:p-6
                         shadow-[0_25px_60px_rgba(15,23,42,0.45)]
                         border border-white/10 relative overflow-hidden"
              >
                <div
                  aria-hidden
                  className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/5 blur-3xl"
                />
                <div
                  aria-hidden
                  className="absolute -left-16 -bottom-16 h-52 w-52 rounded-full bg-gray-400/10 blur-3xl"
                />

                <div className="flex items-center justify-between mb-4 relative z-10">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-gray-300 mb-1">
                      <span className="h-2 w-2 rounded-full bg-gray-400 animate-pulse" />
                      Live Map Preview
                    </div>
                    <h2 className="text-white text-lg font-semibold">
                      Nearby providers (coming soon)
                    </h2>
                    <p className="text-xs text-gray-300 mt-1 max-w-sm">
                      You’ll soon see real-time positions of service providers,
                      movement tracking, and estimated arrival times here.
                    </p>
                  </div>
                  <div className="hidden lg:flex items-center gap-2 text-xs text-gray-300">
                    <MapPin size={16} />
                    <span>{profile?.state || "Lagos, Nigeria"}</span>
                  </div>
                </div>

                {/* Fake map grid */}
                <div
                  className="relative mt-4 h-40 lg:h-44 rounded-2xl overflow-hidden
                           border border-white/15 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.18),_transparent_55%),_linear-gradient(135deg,_rgba(15,23,42,0.9),_rgba(15,23,42,0.95))]"
                >
                  <div
                    className="absolute inset-0 opacity-40"
                    style={{
                      backgroundImage:
                        "linear-gradient(90deg, rgba(148,163,184,0.25) 1px, transparent 1px), linear-gradient(180deg, rgba(148,163,184,0.25) 1px, transparent 1px)",
                      backgroundSize: "32px 32px",
                    }}
                  />
                  <div className="absolute left-1/4 top-1/3 h-6 w-6 rounded-full bg-gray-400/80 flex items-center justify-center text-[9px] text-[#0b1220] font-bold shadow-lg">
                    1
                  </div>
                  <div className="absolute right-1/3 bottom-1/3 h-7 w-7 rounded-full bg-orange-400/90 flex items-center justify-center text-[9px] text-[#0b1220] font-bold shadow-lg">
                    2
                  </div>
                  <div className="absolute right-10 top-6 h-5 w-5 rounded-full bg-sky-400/90 flex items-center justify-center text-[9px] text-[#0b1220] font-bold shadow-md">
                    3
                  </div>
                </div>
              </motion.div>

              {/* PROFILE COMPLETION */}
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.08 }}
                className="bg-[#f8fbff] rounded-3xl p-5 border border-white/60
                         shadow-[0_18px_40px_rgba(15,23,42,0.12)]"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-[#0b1220]">
                    Profile completion
                  </h3>
                  <span className="text-xs text-gray-500">
                    {profileCompletion}%
                  </span>
                </div>

                <div className="relative h-3 rounded-full bg-[#e5e9f2] mb-3 overflow-hidden">
                  <div
                    className="absolute left-0 top-0 h-full rounded-full
                             bg-gradient-to-r from-[#0b1220] via-[#3b485f] to-[#22c55e]"
                    style={{ width: `${profileCompletion}%` }}
                  />
                </div>

                <ul className="space-y-1 text-xs text-gray-500">
                  <li>• Add a profile picture</li>
                  <li>• Confirm your primary address</li>
                  <li>• Set up your wallet for faster payments</li>
                </ul>

                <button
                  onClick={() => alert("Profile setup coming soon")}
                  className="mt-4 w-full py-2.5 rounded-xl text-xs font-medium
                           bg-[#0b1220] text-white shadow-sm"
                >
                  Continue profile setup
                </button>
              </motion.div>
            </div>

            {/* SUMMARY CARDS */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.1 }}
              className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 lg:mb-8"
            >
              <SummaryCard
                title="Wallet Balance"
                value={stats.walletBalance}
                caption="Top up wallet"
                icon={<CreditCard size={18} />}
                onClick={() => router.push("/seeker/wallet")}
              />
              <SummaryCard
                title="Bookings this month"
                value={stats.bookingsThisMonth}
                caption="View all bookings"
                icon={<CalendarDays size={18} />}
                onClick={() => alert("Bookings page coming soon")}
              />
              <SummaryCard
                title="Upcoming appointments"
                value={stats.upcomingAppointments}
                caption="Check schedule"
                icon={<Clock size={18} />}
                onClick={() => alert("Upcoming list coming soon")}
              />
              <SummaryCard
                title="Providers nearby"
                value={providersNearbyCount}
                caption="View on map"
                icon={<Users size={18} />}
                onClick={() => alert("Map filter coming soon")}
              />
            </motion.div>

            {/* BOTTOM ROW */}
            <div className="grid lg:grid-cols-2 gap-5">
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.12 }}
                className="bg-[#f8fbff] rounded-3xl p-5 border border-white/60
                         shadow-[0_18px_40px_rgba(15,23,42,0.10)]"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-[#0b1220]">
                    Upcoming appointments
                  </h3>
                  <button
                    onClick={() => alert("Full schedule coming soon")}
                    className="text-[11px] text-gray-500 hover:text-[#0b1220]"
                  >
                    View all
                  </button>
                </div>

                <p className="text-xs text-gray-500 mb-4">
                  You don’t have any upcoming services yet. Once you make a
                  booking, it will appear here.
                </p>

                <div className="rounded-2xl border border-dashed border-gray-300 bg-white/70 py-6 flex flex-col items-center justify-center">
                  <CalendarDays size={22} className="text-gray-400 mb-2" />
                  <p className="text-xs text-gray-500 mb-2">
                    Ready when you are.
                  </p>
                  <button
                    onClick={handleBookService}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium
                             bg-gradient-to-r from-[#0b1220] to-[#3b485f]
                             text-white shadow-md"
                  >
                    Book your first service
                    <ArrowRight size={14} />
                  </button>
                </div>
              </motion.div>

              {showPremiumProviders && (
                <motion.div
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: 0.14 }}
                  className="bg-[#f8fbff] rounded-3xl p-5 border border-white/60
                           shadow-[0_18px_40px_rgba(15,23,42,0.10)]"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-[#0b1220]">
                      Recommended providers (Premium)
                    </h3>
                    <span className="text-[11px] text-amber-500 font-medium">
                      Promoted
                    </span>
                  </div>

                  <p className="text-xs text-gray-500 mb-4">
                    These are highlighted providers that pay for visibility.
                  </p>

                  <div className="space-y-3">
                    <ProviderCard
                      name="FixRight Plumbing"
                      category="Plumber • Lagos"
                      rating={4.9}
                      jobs="120+ jobs done"
                    />
                    <ProviderCard
                      name="SparkPro Electricians"
                      category="Electrician • Lekki"
                      rating={4.8}
                      jobs="98 jobs done"
                    />
                  </div>
                </motion.div>
              )}
            </div>
          </main>
        </div>
      </div>
    </SeekerLayout>
  );
}

// ✅ EXPORT WRAPPED BY AUTH GUARD
export default function ProtectedSeekerDashboard() {
  return (
    <RequireRole role="seeker">
      <SeekerDashboard />
    </RequireRole>
  );
}

function SummaryCard({ title, value, caption, icon, onClick }) {
  return (
    <button
      onClick={onClick}
      className="bg-[#f8fbff] rounded-2xl p-4 text-left
                 border border-white/60 shadow-[0_14px_32px_rgba(15,23,42,0.08)]
                 hover:shadow-[0_20px_40px_rgba(15,23,42,0.16)]
                 transition-all duration-200"
    >
      <div className="flex items-center justify-between mb-3">
        <div
          className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#0b1220] to-[#3b485f]
                        flex items-center justify-center text-white text-xs"
        >
          {icon}
        </div>
      </div>
      <div className="text-[11px] text-gray-500 mb-1">{title}</div>
      <div className="text-lg font-semibold text-[#0b1220] mb-1">{value}</div>
      <div className="text-[11px] text-gray-400">{caption}</div>
    </button>
  );
}

function ProviderCard({ name, category, rating, jobs }) {
  return (
    <div
      className="flex items-center justify-between p-3 rounded-2xl
                 bg-white/90 border border-gray-100"
    >
      <div className="flex items-center gap-3">
        <div
          className="h-10 w-10 rounded-2xl bg-gradient-to-br from-[#0b1220] to-[#3b485f]
                     flex items-center justify-center text-[11px] font-bold text-white"
        >
          {name
            .split(" ")
            .map((w) => w[0])
            .join("")
            .slice(0, 2)}
        </div>
        <div>
          <div className="text-sm font-semibold text-[#0b1220]">{name}</div>
          <div className="text-[11px] text-gray-500">{category}</div>
          <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-1">
            <span className="flex items-center gap-1">
              <Star size={12} className="text-amber-400" />
              <span>{rating}</span>
            </span>
            <span>•</span>
            <span>{jobs}</span>
          </div>
        </div>
      </div>

      <button
        onClick={() => alert("Provider profile coming soon")}
        className="text-[11px] px-3 py-1.5 rounded-xl bg-[#0b1220] text-white"
      >
        View
      </button>
    </div>
  );
}