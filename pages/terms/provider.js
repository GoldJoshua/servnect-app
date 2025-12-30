// pages/terms/provider.js
import Head from "next/head";
import Link from "next/link";

export default function ProviderTermsPage() {
  const VERSION = "v1.0";
  const LAST_UPDATED = "December 30, 2025";

  return (
    <>
      <Head>
        <title>ServiceConnect – Provider Terms & Conditions</title>
        <meta
          name="description"
          content="ServiceConnect Terms & Conditions for Providers."
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
                Provider Terms
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
                Terms & Conditions — Providers
              </h1>
              <p className="mt-3 text-sm text-gray-600">
                <span className="font-semibold text-[#0b1220]">Last Updated:</span>{" "}
                {LAST_UPDATED} •{" "}
                <span className="font-semibold text-[#0b1220]">Version:</span>{" "}
                {VERSION}
              </p>
              <p className="mt-4 text-gray-700 leading-relaxed">
                These Terms govern your use of the ServiceConnect platform as a
                <span className="font-semibold"> Provider</span> (a person or business
                offering services). If you do not agree, do not use the platform.
              </p>
            </div>

            <div className="px-8 py-10 prose prose-gray max-w-none">
              <h2>1. Definitions</h2>
              <ul>
                <li>
                  <strong>“Provider”</strong> means an independent third-party offering
                  services through the Platform.
                </li>
                <li>
                  <strong>“Seeker”</strong> means a user requesting services.
                </li>
                <li>
                  <strong>“Platform”</strong> means ServiceConnect website, mobile apps,
                  and related services.
                </li>
              </ul>

              <h2>2. Independent Contractor Status (Critical)</h2>
              <p>
                You acknowledge that you are an <strong>independent contractor</strong>{" "}
                and not an employee, agent, partner, or representative of ServiceConnect.
                You have no authority to bind ServiceConnect, and nothing in these Terms
                creates an employment, agency, joint venture, or partnership relationship.
              </p>

              <h2>3. Registration & Accuracy</h2>
              <ul>
                <li>You must provide accurate and complete information.</li>
                <li>
                  You must maintain up-to-date profile information including service
                  category, location, and contact details.
                </li>
                <li>
                  Verification (if any) does not constitute endorsement or guarantee.
                </li>
              </ul>

              <h2>4. Service Delivery Responsibilities</h2>
              <p>You are solely responsible for:</p>
              <ul>
                <li>Quality of work and service outcomes</li>
                <li>Tools, materials, equipment, and staffing</li>
                <li>Safety practices and compliance with laws</li>
                <li>Licenses, permits, and professional requirements</li>
                <li>Pricing, scope, timelines, and deliverables</li>
              </ul>

              <h2>5. Job Requests & Acceptance</h2>
              <ul>
                <li>You may accept or reject requests at your discretion.</li>
                <li>
                  Once accepted, you are responsible for fulfilling the agreed service.
                </li>
                <li>
                  Repeated cancellations, fraud, or misconduct may reduce visibility or
                  result in suspension/termination.
                </li>
              </ul>

              <h2>6. Payments, Fees & Platform Rules</h2>
              <p>
                ServiceConnect may facilitate payments via third-party processors (e.g.
                Paystack) and may charge platform or facilitation fees. Attempting to
                bypass the Platform to avoid fees, solicit off-platform payment, or move
                users off-platform in a way that violates policies may result in
                suspension or termination.
              </p>

              <h2>7. Insurance, Risk & Liability</h2>
              <p>
                You are fully responsible for damages, injuries, losses, claims, and
                legal liabilities arising from your services. ServiceConnect provides
                <strong> no insurance coverage</strong> for Providers.
              </p>

              <h2>8. Reviews & Conduct</h2>
              <ul>
                <li>Reviews are user-generated and may affect your visibility.</li>
                <li>Manipulation of reviews or ratings is prohibited.</li>
                <li>
                  Harassment, intimidation, discrimination, fraud, theft, or unsafe conduct
                  may lead to termination and may be reported to authorities where required.
                </li>
              </ul>

              <h2>9. Investigations & Enforcement</h2>
              <p>
                ServiceConnect may investigate complaints and may request documents or
                evidence. We may suspend accounts during investigations and may share
                information where legally required.
              </p>

              <h2>10. Suspension & Termination</h2>
              <p>
                We may suspend or terminate your access at our sole discretion, including
                for safety, fraud, policy violations, or legal risk. No compensation is
                owed for lost income or missed opportunities resulting from enforcement.
              </p>

              <h2>11. Limitation of Liability</h2>
              <p>
                ServiceConnect is not liable for lost income, missed jobs, account
                restrictions, platform downtime, third-party actions, or indirect damages.
                If liability is established, it is limited to fees paid to ServiceConnect
                (if any) relating to the relevant transaction.
              </p>

              <h2>12. Indemnity</h2>
              <p>
                You agree to indemnify and hold ServiceConnect harmless from claims,
                damages, losses, liabilities, and expenses arising from your services,
                your conduct, disputes with Seekers, or breach of these Terms.
              </p>

              <h2>13. Privacy & Data</h2>
              <p>
                Provider data is handled according to our Privacy Policy. Communication on
                the Platform may be monitored for fraud prevention, safety, and compliance.
              </p>

              <h2>14. Governing Law</h2>
              <p>
                These Terms are governed by the laws of the Federal Republic of Nigeria.
              </p>

              <h2>15. Changes to Terms</h2>
              <p>
                We may update these Terms from time to time. Continued use of the Platform
                after updates constitutes acceptance of the updated Terms.
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