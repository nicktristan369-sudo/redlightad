import Link from "next/link";
import Navbar from "@/components/Navbar";

export const metadata = {
  title: "Cookie Policy — RedLightAD",
};

export default function CookiePolicyPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen py-12" style={{ background: "#F5F5F7" }}>
        <div className="mx-auto px-4 sm:px-6" style={{ maxWidth: "800px" }}>
          <div className="bg-white rounded-2xl border border-[#E5E5E5] p-8 sm:p-12">
            <p className="text-[12px] font-medium text-gray-400 mb-2">Last updated: March 2026</p>
            <h1 className="text-[32px] font-black text-gray-900 mb-2">Cookie Policy</h1>
            <p className="text-[15px] text-gray-500 mb-10 pb-8" style={{ borderBottom: "1px solid #F3F4F6" }}>
              This Cookie Policy explains what cookies are, how we use them, and how you can control them.
            </p>
            <div className="space-y-8 text-[15px] leading-relaxed text-gray-600">
              <div>
                <h2 className="text-[18px] font-bold text-gray-900 mb-3">What are cookies?</h2>
                <p>Cookies are small text files stored on your device when you visit a website. They help the website remember your preferences and improve your experience.</p>
              </div>
              <div>
                <h2 className="text-[18px] font-bold text-gray-900 mb-3">Cookies we use</h2>
                <div className="space-y-3">
                  {[
                    { cat: "Necessary", desc: "Authentication tokens, session management, CSRF protection. Required for the Platform to function.", canDisable: false },
                    { cat: "Analytics", desc: "Page views, session duration, feature usage. Help us improve the Platform.", canDisable: true },
                    { cat: "Marketing", desc: "Relevant content and interest-based personalisation.", canDisable: true },
                  ].map(c => (
                    <div key={c.cat} className="flex items-start justify-between gap-4 p-3 rounded-xl" style={{ background: "#F9FAFB" }}>
                      <div>
                        <p className="text-[13px] font-semibold text-gray-900">{c.cat}</p>
                        <p className="text-[13px] text-gray-500 mt-0.5">{c.desc}</p>
                      </div>
                      <span className={`text-[11px] font-semibold flex-shrink-0 px-2 py-0.5 rounded-full ${c.canDisable ? "bg-yellow-50 text-yellow-700" : "bg-gray-100 text-gray-500"}`}>
                        {c.canDisable ? "Consent" : "Required"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h2 className="text-[18px] font-bold text-gray-900 mb-3">Managing cookies</h2>
                <p>You can manage cookie preferences via the banner shown on your first visit, or by contacting us. You can also control cookies through your browser settings — note that disabling necessary cookies may affect Platform functionality.</p>
              </div>
            </div>
            <div className="mt-12 pt-8 flex gap-4 flex-wrap" style={{ borderTop: "1px solid #F3F4F6" }}>
              <Link href="/privacy" className="text-[13px] text-gray-500 hover:text-gray-900 underline">Privacy Policy</Link>
              <Link href="/terms" className="text-[13px] text-gray-500 hover:text-gray-900 underline">Terms of Service</Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
