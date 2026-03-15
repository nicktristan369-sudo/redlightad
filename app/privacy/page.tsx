import Link from "next/link";
import Navbar from "@/components/Navbar";

export const metadata = {
  title: "Privacy Policy — RedLightAD",
  description: "GDPR-compliant Privacy Policy for RedLightAD",
};

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen py-12" style={{ background: "#F5F5F7" }}>
        <div className="mx-auto px-4 sm:px-6" style={{ maxWidth: "800px" }}>
          <div className="bg-white rounded-2xl border border-[#E5E5E5] p-8 sm:p-12">

            <p className="text-[12px] font-medium text-gray-400 mb-2">Last updated: March 2026</p>
            <h1 className="text-[32px] font-black text-gray-900 mb-2">Privacy Policy</h1>
            <p className="text-[15px] text-gray-500 mb-10 pb-8" style={{ borderBottom: "1px solid #F3F4F6" }}>
              This Privacy Policy explains how RedLightAD collects, uses, and protects your personal data in accordance with the General Data Protection Regulation (GDPR) and applicable privacy laws.
            </p>

            <div className="space-y-10 text-[15px] leading-relaxed">

              <Section num="1" title="Data Controller">
                <p>The data controller responsible for your personal data is:</p>
                <div className="mt-3 space-y-0.5 text-gray-600">
                  <p><strong>RedLightAD</strong></p>
                  <p>Denmark</p>
                  <p>Email: contact@redlightad.com</p>
                </div>
              </Section>

              <Section num="2" title="What Data We Collect">
                <p>We collect the following categories of personal data:</p>
                <div className="mt-4 space-y-4">
                  <DataItem label="Account data" desc="Email address, password (hashed), account type (Provider/Customer), registration date" />
                  <DataItem label="Profile data" desc="Name, age, gender, location, photos, videos, description — provided voluntarily by Providers" />
                  <DataItem label="Transaction data" desc="RedCoin purchases, payout requests, purchase history — linked to your account" />
                  <DataItem label="Usage data" desc="Pages visited, features used, IP address, device type, browser — for analytics and security" />
                  <DataItem label="Communication data" desc="Messages sent through the Platform (stored encrypted)" />
                  <DataItem label="Technical data" desc="Log files, error reports, session tokens — for security and performance" />
                </div>
              </Section>

              <Section num="3" title="How We Use Your Data">
                <p>We use your personal data to:</p>
                <ul className="mt-3 space-y-1.5 list-disc list-inside text-gray-600">
                  <li>Provide and operate the RedLightAD Platform</li>
                  <li>Process payments and manage RedCoin transactions</li>
                  <li>Verify user age and identity where required</li>
                  <li>Send account-related emails (confirmations, password resets)</li>
                  <li>Prevent fraud, abuse, and illegal activity</li>
                  <li>Improve our services through analytics</li>
                  <li>Comply with legal obligations</li>
                </ul>
              </Section>

              <Section num="4" title="Legal Basis (GDPR)">
                <p>We process your personal data based on the following legal grounds under GDPR Article 6:</p>
                <div className="mt-4 space-y-3">
                  <LegalBasis basis="Contract performance (Art. 6(1)(b))" desc="Processing necessary to provide the service you signed up for" />
                  <LegalBasis basis="Legitimate interests (Art. 6(1)(f))" desc="Fraud prevention, security, analytics, and Platform improvement" />
                  <LegalBasis basis="Legal obligation (Art. 6(1)(c))" desc="Compliance with applicable laws, including anti-trafficking and age verification requirements" />
                  <LegalBasis basis="Consent (Art. 6(1)(a))" desc="Marketing cookies and non-essential analytics (withdrawn at any time)" />
                </div>
              </Section>

              <Section num="5" title="Data Retention">
                <p>We retain your personal data for as long as necessary:</p>
                <ul className="mt-3 space-y-1.5 list-disc list-inside text-gray-600">
                  <li><strong>Active accounts:</strong> for the duration of your account</li>
                  <li><strong>Closed accounts:</strong> 30 days after deletion, then permanently erased</li>
                  <li><strong>Transaction records:</strong> 5 years (legal/tax obligation)</li>
                  <li><strong>Log files:</strong> 90 days for security purposes</li>
                  <li><strong>Content:</strong> deleted within 30 days of account closure</li>
                </ul>
              </Section>

              <Section num="6" title="Your Rights">
                <p>Under GDPR, you have the following rights regarding your personal data:</p>
                <div className="mt-4 space-y-3">
                  <Right right="Right of access" desc="Request a copy of all personal data we hold about you" />
                  <Right right="Right to rectification" desc="Request correction of inaccurate or incomplete data" />
                  <Right right="Right to erasure" desc="Request deletion of your data ('right to be forgotten'), subject to legal exceptions" />
                  <Right right="Right to restriction" desc="Request that we limit processing of your data in certain circumstances" />
                  <Right right="Right to portability" desc="Receive your data in a structured, machine-readable format" />
                  <Right right="Right to object" desc="Object to processing based on legitimate interests" />
                  <Right right="Right to withdraw consent" desc="Withdraw consent at any time for consent-based processing (e.g. marketing cookies)" />
                </div>
                <p className="mt-4">To exercise any of these rights, contact us at <strong>contact@redlightad.com</strong>. We will respond within 30 days. You also have the right to lodge a complaint with your national supervisory authority (in Denmark: Datatilsynet — <strong>dt.dk</strong>).</p>
              </Section>

              <Section num="7" title="Cookies">
                <p>We use the following categories of cookies:</p>
                <div className="mt-4 space-y-3">
                  <DataItem label="Necessary cookies" desc="Required for authentication, security, and core functionality. Cannot be disabled." />
                  <DataItem label="Analytics cookies" desc="Help us understand how users interact with the Platform (e.g. page views, session duration). Require consent." />
                  <DataItem label="Marketing cookies" desc="Used to display relevant content. Require consent." />
                </div>
                <p className="mt-4">You can manage your cookie preferences at any time via the cookie banner or by contacting us. See our full <Link href="/cookies" className="underline hover:text-gray-900">Cookie Policy</Link>.</p>
              </Section>

              <Section num="8" title="Third Party Services">
                <p>We use trusted third-party services to operate the Platform:</p>
                <div className="mt-4 space-y-3">
                  <ThirdParty name="Supabase" purpose="Authentication, database, and real-time services" privacy="supabase.com/privacy" />
                  <ThirdParty name="Cloudinary" purpose="Media storage and delivery (images, videos)" privacy="cloudinary.com/privacy" />
                  <ThirdParty name="Stripe" purpose="Payment processing for RedCoin purchases" privacy="stripe.com/privacy" />
                  <ThirdParty name="Resend" purpose="Transactional email delivery" privacy="resend.com/privacy" />
                  <ThirdParty name="Vercel" purpose="Hosting and content delivery" privacy="vercel.com/legal/privacy-policy" />
                </div>
                <p className="mt-4">Each provider acts as a data processor under our instructions and is bound by appropriate data processing agreements.</p>
              </Section>

              <Section num="9" title="International Transfers">
                <p>Some of our service providers may process data outside the European Economic Area (EEA). Where this occurs, we ensure appropriate safeguards are in place, including:</p>
                <ul className="mt-3 space-y-1.5 list-disc list-inside text-gray-600">
                  <li>Standard Contractual Clauses (SCCs) approved by the European Commission</li>
                  <li>Adequacy decisions by the European Commission</li>
                  <li>Certification under recognized frameworks (e.g. EU-US Data Privacy Framework)</li>
                </ul>
              </Section>

              <Section num="10" title="Contact & DPO">
                <p>For any privacy-related questions, requests, or complaints, contact us:</p>
                <div className="mt-3 space-y-1 text-gray-600">
                  <p><strong>Email:</strong> contact@redlightad.com</p>
                  <p><strong>Response time:</strong> Within 30 days</p>
                  <p><strong>Supervisory authority:</strong> Datatilsynet (Denmark) — <a href="https://www.datatilsynet.dk" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-900">datatilsynet.dk</a></p>
                </div>
              </Section>

            </div>

            {/* Footer links */}
            <div className="mt-12 pt-8 flex gap-4 flex-wrap" style={{ borderTop: "1px solid #F3F4F6" }}>
              <Link href="/terms" className="text-[13px] text-gray-500 hover:text-gray-900 underline">Terms of Service</Link>
              <Link href="/cookies" className="text-[13px] text-gray-500 hover:text-gray-900 underline">Cookie Policy</Link>
              <Link href="/support" className="text-[13px] text-gray-500 hover:text-gray-900 underline">Contact Support</Link>
            </div>

          </div>
        </div>
      </main>
    </>
  );
}

function Section({ num, title, children }: { num: string; title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-[18px] font-bold text-gray-900 mb-3 flex items-center gap-2">
        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full text-[12px] font-bold text-white flex-shrink-0"
          style={{ background: "#000" }}>
          {num}
        </span>
        {title}
      </h2>
      <div className="text-gray-600 pl-9">{children}</div>
    </section>
  );
}

function DataItem({ label, desc }: { label: string; desc: string }) {
  return (
    <div className="flex gap-3 p-3 rounded-xl" style={{ background: "#F9FAFB" }}>
      <div>
        <p className="text-[13px] font-semibold text-gray-900">{label}</p>
        <p className="text-[13px] text-gray-500 mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

function LegalBasis({ basis, desc }: { basis: string; desc: string }) {
  return (
    <div className="flex gap-3">
      <div className="mt-1 w-2 h-2 rounded-full flex-shrink-0" style={{ background: "#000" }} />
      <div>
        <p className="text-[13px] font-semibold text-gray-900">{basis}</p>
        <p className="text-[13px] text-gray-500 mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

function Right({ right, desc }: { right: string; desc: string }) {
  return (
    <div className="flex gap-3 p-3 rounded-xl" style={{ background: "#F9FAFB" }}>
      <div>
        <p className="text-[13px] font-semibold text-gray-900">{right}</p>
        <p className="text-[13px] text-gray-500 mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

function ThirdParty({ name, purpose, privacy }: { name: string; purpose: string; privacy: string }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: "#F9FAFB" }}>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-gray-900">{name}</p>
        <p className="text-[13px] text-gray-500 mt-0.5">{purpose}</p>
      </div>
      <a href={`https://${privacy}`} target="_blank" rel="noopener noreferrer"
        className="text-[12px] text-gray-400 hover:text-gray-700 underline flex-shrink-0 transition-colors">
        Privacy
      </a>
    </div>
  );
}
