// pages/terms/seeker.js
import Head from "next/head";
import Link from "next/link";

export default function SeekerTermsPage() {
  const VERSION = "v1.0";
  const LAST_UPDATED = "December 30, 2025";

  return (
    <>
      <Head>
        <title>ServiceConnect – Seeker Terms & Conditions</title>
        <meta
          name="description"
          content="ServiceConnect Terms & Conditions for Seekers."
        />
      </Head>

      <div className="min-h-screen bg-[#eef1f6]">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-black/5">
          <div className="max-w-4xl mx-auto px-5 py-4 flex items-center justify-between">
            <Link
              href="/"
              className="font-extrabold tracking-tight text-[#0b1220]"
            >
              ServiceConnect
            </Link>

            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-black/5 text-[#0b1220]">
                Seeker Terms
              </span>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-black/5 text-[#0b1220]">
                {VERSION}
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-5 py-10">
          <div className="bg-white rounded-3xl shadow-[0_18px_60px_rgba(0,0,0,0.08)] border border-white/60 overflow-hidden">
            <div className="px-8 py-10 border-b border-black/5 bg-gradient-to-br from-[#ffffff] to-[#f7f9fc]">
              <h1 className="text-3xl md:text-4xl font-extrabold text-[#0b1220] tracking-tight">
                Terms & Conditions — Seekers
              </h1>
              <p className="mt-3 text-sm text-gray-600">
                <span className="font-semibold text-[#0b1220]">Last Updated:</span>{" "}
                {LAST_UPDATED} •{" "}
                <span className="font-semibold text-[#0b1220]">Version:</span>{" "}
                {VERSION}
              </p>
              <p className="mt-4 text-gray-700 leading-relaxed">
                These Terms govern your use of the ServiceConnect platform as a
                <span className="font-semibold"> Seeker</span> (a person or business
                requesting services). If you do not agree, do not use the platform.
              </p>
            </div>

            <div className="px-8 py-10 prose prose-gray max-w-none">
              <h2>1. Definitions</h2>
              <ul>
                <li>
                  <strong>“Platform”</strong> means the ServiceConnect website, mobile
                  apps, and related services.
                </li>
                <li>
                  <strong>“Seeker”</strong> means any user requesting or purchasing
                  services.
                </li>
                <li>
                  <strong>“Provider”</strong> means an independent third-party person
                  or business offering services through the Platform.
                </li>
                <li>
                  <strong>“Services”</strong> means any services provided by Providers.
                </li>
              </ul>

              <h2>2. Acceptance of Terms</h2>
              <p>
                By registering, clicking “I Agree”, or using the Platform, you confirm
                that you have read, understood, and agree to be legally bound by these
                Terms and any policies referenced here.
              </p>

              <h2>3. Platform Role (Critical)</h2>
              <p>
                ServiceConnect is a technology marketplace that connects Seekers with
                Providers. We do <strong>not</strong> provide the Services ourselves,
                do <strong>not</strong> employ Providers, and do <strong>not</strong>{" "}
                supervise service delivery. Any agreement for Services is strictly
                between you and the Provider.
              </p>

              <h2>4. Eligibility & Account Responsibility</h2>
              <ul>
                <li>You must be at least 18 years old.</li>
                <li>You must provide accurate and complete information.</li>
                <li>
                  You are responsible for maintaining your account security and all
                  activity under your account.
                </li>
              </ul>

              <h2>5. Requests, Bookings & Communication</h2>
              <ul>
                <li>Requests made on the Platform are non-binding until accepted.</li>
                <li>
                  Providers may accept or decline requests at their discretion.
                </li>
                <li>
                  Pricing, timelines, scope, materials, and deliverables are agreed
                  directly between you and the Provider.
                </li>
                <li>
                  Off-platform communication or payment is at your own risk and may
                  reduce our ability to assist.
                </li>
              </ul>

              <h2>6. Payments, Fees & Third-Party Processing</h2>
              <p>
                Payments may be facilitated through third-party processors (e.g.
                Paystack). ServiceConnect may charge platform or facilitation fees,
                which may be displayed before confirmation. We do not store your card
                details. We are not responsible for cash or off-platform payments.
              </p>

              <h2>7. Cancellations, Refunds & Disputes</h2>
              <ul>
                <li>Refunds are not guaranteed unless required by law or stated.</li>
                <li>
                  Disputes should be resolved directly with the Provider first.
                </li>
                <li>
                  ServiceConnect may assist at our discretion but is not obligated to
                  resolve disputes or guarantee outcomes.
                </li>
              </ul>

              <h2>8. User Conduct</h2>
              <p>You agree not to:</p>
              <ul>
                <li>Harass, threaten, or abuse Providers or other users.</li>
                <li>Submit false claims, reports, or reviews.</li>
                <li>Use the Platform for illegal or harmful activities.</li>
                <li>Attempt to circumvent platform safeguards or fees.</li>
              </ul>

              <h2>9. Ratings & Reviews</h2>
              <p>
                Reviews are user-generated and reflect opinions. We may remove reviews
                that violate policies (e.g. hate, harassment, fraud, spam).
              </p>

              <h2>10. Suspension & Termination</h2>
              <p>
                We may suspend or terminate your account at our sole discretion,
                including for safety reasons, suspected fraud, or Terms violations.
              </p>

              <h2>11. Limitation of Liability</h2>
              <p>
                To the maximum extent permitted by law, ServiceConnect is not liable
                for Provider actions or omissions, service outcomes, delays,
                cancellations, property damage, injuries, losses, or consequential
                damages. If liability is established, it is limited to fees paid to
                ServiceConnect (if any) relating to the relevant transaction.
              </p>

              <h2>12. Indemnity</h2>
              <p>
                You agree to indemnify and hold ServiceConnect harmless from claims,
                damages, losses, liabilities, and expenses arising from your use of
                the Platform, disputes with Providers, or breach of these Terms.
              </p>

              <h2>13. Privacy & Data</h2>
              <p>
                Your data is handled according to our Privacy Policy. Third-party
                services may process data where necessary to deliver Platform features
                (e.g., payments, notifications).
              </p>

              <h2>14. Governing Law</h2>
              <p>
                These Terms are governed by the laws of the Federal Republic of Nigeria.
              </p>

              <h2>15. Changes to Terms</h2>
              <p>
                We may update these Terms from time to time. Continued use of the
                Platform after updates constitutes acceptance of the updated Terms.
              </p>
            </div>

            <div className="px-8 py-8 border-t border-black/5 bg-[#fbfcff]">
              <p className="text-xs text-gray-500">
                If you have questions, contact Support via the Platform.
              </p>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-gray-500">
            © {new Date().getFullYear()} ServiceConnect. All rights reserved.
          </div>
        </div>
      </div>
    </>
  );
}