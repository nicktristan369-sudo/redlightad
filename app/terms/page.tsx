import Link from "next/link";
import Navbar from "@/components/Navbar";

export const metadata = {
  title: "Terms of Service — RedLightAD",
  description: "Terms of Service for RedLightAD",
};

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen py-12" style={{ background: "#F5F5F7" }}>
        <div className="mx-auto px-4 sm:px-6" style={{ maxWidth: "800px" }}>
          <div className="bg-white rounded-2xl border border-[#E5E5E5] p-8 sm:p-12">

            <p className="text-[12px] font-medium text-gray-400 mb-2">Last updated: March 2026</p>
            <h1 className="text-[32px] font-black text-gray-900 mb-2">Terms of Service</h1>
            <p className="text-[15px] text-gray-500 mb-10 pb-8" style={{ borderBottom: "1px solid #F3F4F6" }}>
              Please read these Terms of Service carefully before using RedLightAD. By accessing or using our platform, you agree to be bound by these terms.
            </p>

            <div className="space-y-10 text-[15px] leading-relaxed">

              <Section num="1" title="Acceptance of Terms">
                <p>By accessing or using RedLightAD (&quot;Platform&quot;, &quot;we&quot;, &quot;us&quot;), you confirm that you have read, understood, and agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree, you must not use the Platform.</p>
                <p className="mt-3">We reserve the right to modify these terms at any time. Continued use of the Platform after changes constitutes acceptance of the updated terms.</p>
              </Section>

              <Section num="2" title="Age Verification (18+)">
                <p>RedLightAD is an adult platform strictly for users who are <strong>18 years of age or older</strong>. By using this Platform, you confirm that:</p>
                <ul className="mt-3 space-y-1.5 list-disc list-inside text-gray-600">
                  <li>You are at least 18 years old</li>
                  <li>You have verified the age of any person depicted in content you upload</li>
                  <li>You are not accessing the Platform from a jurisdiction where adult content is prohibited</li>
                </ul>
                <p className="mt-3">We reserve the right to terminate accounts and report violations to the relevant authorities where required by law.</p>
              </Section>

              <Section num="3" title="User Accounts">
                <p>To access certain features, you must register an account. You agree to:</p>
                <ul className="mt-3 space-y-1.5 list-disc list-inside text-gray-600">
                  <li>Provide accurate, current, and complete information</li>
                  <li>Maintain the security of your password and account</li>
                  <li>Accept responsibility for all activity under your account</li>
                  <li>Notify us immediately of any unauthorized access</li>
                </ul>
                <p className="mt-3">Account types (Provider / Customer) are permanent and cannot be changed after registration.</p>
              </Section>

              <Section num="4" title="Content Guidelines">
                <p>Providers are solely responsible for the content they post. All content must:</p>
                <ul className="mt-3 space-y-1.5 list-disc list-inside text-gray-600">
                  <li>Depict only consenting adults (18+)</li>
                  <li>Comply with all applicable local, national, and international laws</li>
                  <li>Not involve coercion, exploitation, trafficking, or minors</li>
                  <li>Include accurate descriptions and representations</li>
                </ul>
                <p className="mt-3">All new listings are subject to review before publication. We reserve the right to remove any content at our sole discretion.</p>
              </Section>

              <Section num="5" title="Prohibited Activities">
                <p>You may not use RedLightAD to:</p>
                <ul className="mt-3 space-y-1.5 list-disc list-inside text-gray-600">
                  <li>Post, distribute, or solicit child sexual abuse material (CSAM) — zero tolerance, reported to authorities</li>
                  <li>Engage in human trafficking or exploitation</li>
                  <li>Harass, threaten, or abuse other users</li>
                  <li>Circumvent security features or access controls</li>
                  <li>Use automated scripts, bots, or scrapers</li>
                  <li>Create multiple accounts for fraudulent purposes</li>
                  <li>Post false, misleading, or deceptive content</li>
                  <li>Violate any applicable laws or regulations</li>
                </ul>
                <p className="mt-3">Violations may result in immediate account termination and reporting to law enforcement.</p>
              </Section>

              <Section num="6" title="Payment Terms & RedCoins">
                <p>RedLightAD operates an internal virtual currency system called <strong>RedCoins</strong>.</p>
                <ul className="mt-3 space-y-1.5 list-disc list-inside text-gray-600">
                  <li>RedCoins are purchased with real currency and used to unlock content and services</li>
                  <li>All purchases are final — no refunds unless required by applicable consumer law</li>
                  <li>RedCoins have no cash value and cannot be exchanged for fiat currency by customers</li>
                  <li>Providers may request payouts subject to minimum thresholds and identity verification</li>
                  <li>We reserve the right to adjust coin pricing with reasonable notice</li>
                  <li>Fraudulent chargebacks will result in permanent account suspension</li>
                </ul>
              </Section>

              <Section num="7" title="Privacy & Data">
                <p>Your privacy is important to us. Our use of your personal data is governed by our <Link href="/privacy" className="underline hover:text-gray-900">Privacy Policy</Link>, which forms part of these Terms. By using the Platform, you consent to the processing of your data as described therein.</p>
              </Section>

              <Section num="8" title="Intellectual Property">
                <p>You retain ownership of content you upload. By posting content on RedLightAD, you grant us a worldwide, non-exclusive, royalty-free license to store, display, and distribute your content solely for the purposes of operating the Platform.</p>
                <p className="mt-3">RedLightAD&apos;s brand, logo, design, and software are protected by intellectual property laws. You may not copy, reproduce, or distribute any part of our Platform without prior written permission.</p>
              </Section>

              <Section num="9" title="Disclaimers">
                <p>RedLightAD is provided &quot;as is&quot; without warranties of any kind. We do not:</p>
                <ul className="mt-3 space-y-1.5 list-disc list-inside text-gray-600">
                  <li>Guarantee the accuracy or reliability of user-posted content</li>
                  <li>Endorse or verify the identity of any provider</li>
                  <li>Accept liability for transactions or interactions between users</li>
                  <li>Guarantee uninterrupted or error-free service</li>
                </ul>
                <p className="mt-3">Use of the Platform is at your own risk.</p>
              </Section>

              <Section num="10" title="Termination">
                <p>We reserve the right to suspend or terminate your account at any time, with or without notice, for violations of these Terms or for any other reason at our sole discretion.</p>
                <p className="mt-3">Upon termination, your right to use the Platform ceases immediately. Unused RedCoins may be forfeited in cases of Terms violations.</p>
              </Section>

              <Section num="11" title="Governing Law">
                <p>These Terms are governed by the laws of Denmark. Any disputes shall be subject to the exclusive jurisdiction of the Danish courts, without prejudice to any mandatory consumer protection laws in your jurisdiction.</p>
              </Section>

              <Section num="12" title="Contact">
                <p>For questions about these Terms, please contact us:</p>
                <div className="mt-3 space-y-1 text-gray-600">
                  <p><strong>Email:</strong> contact@redlightad.com</p>
                  <p><strong>Website:</strong> <Link href="/support" className="underline hover:text-gray-900">redlightad.com/support</Link></p>
                </div>
              </Section>

            </div>

            {/* Footer links */}
            <div className="mt-12 pt-8 flex gap-4 flex-wrap" style={{ borderTop: "1px solid #F3F4F6" }}>
              <Link href="/privacy" className="text-[13px] text-gray-500 hover:text-gray-900 underline">Privacy Policy</Link>
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
          style={{ background: "#000", fontSize: "12px" }}>
          {num}
        </span>
        {title}
      </h2>
      <div className="text-gray-600 pl-9">{children}</div>
    </section>
  );
}
