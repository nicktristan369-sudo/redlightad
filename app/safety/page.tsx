import Navbar from "@/components/Navbar"

export const metadata = {
  title: "Safety Tips | RedLightAD",
  description: "Stay safe while using RedLightAD. Important safety guidelines for providers and customers.",
}

export default function SafetyPage() {
  return (
    <>
      <Navbar />
      <main className="bg-[#F5F5F7] min-h-screen">
        <div className="mx-auto max-w-3xl px-4 py-12">
          <p className="text-sm text-gray-500 mb-2">Last updated: April 2026</p>
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Safety Tips</h1>
          <p className="text-gray-600 mb-8">
            Your safety is our priority. Please read and follow these guidelines to protect yourself while using RedLightAD.
          </p>

          <section className="bg-white rounded-xl p-6 mb-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">For Everyone</h2>
            <ul className="space-y-3 text-gray-600">
              <li className="flex gap-3">
                <span className="text-red-500">•</span>
                <span><strong>Never share personal information</strong> — Avoid sharing your real name, home address, workplace, or financial details with strangers.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-red-500">•</span>
                <span><strong>Trust your instincts</strong> — If something feels wrong, it probably is. Don't hesitate to end a conversation or meeting.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-red-500">•</span>
                <span><strong>Report suspicious behavior</strong> — Use the report feature to flag any user who makes you uncomfortable or violates our terms.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-red-500">•</span>
                <span><strong>Verify before meeting</strong> — Consider a video call to verify identity before any in-person meeting.</span>
              </li>
            </ul>
          </section>

          <section className="bg-white rounded-xl p-6 mb-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">For Providers</h2>
            <ul className="space-y-3 text-gray-600">
              <li className="flex gap-3">
                <span className="text-red-500">•</span>
                <span><strong>Screen clients carefully</strong> — Communicate beforehand and trust your judgment about who you meet.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-red-500">•</span>
                <span><strong>Tell someone your plans</strong> — Let a trusted friend know where you're going and when to expect you back.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-red-500">•</span>
                <span><strong>Meet in safe locations</strong> — Choose well-lit, public meeting points initially. For incall, ensure you have a safe exit.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-red-500">•</span>
                <span><strong>Use separate contact details</strong> — Consider using a work phone number and email separate from your personal accounts.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-red-500">•</span>
                <span><strong>Get payment upfront</strong> — Collect payment before services to avoid disputes.</span>
              </li>
            </ul>
          </section>

          <section className="bg-white rounded-xl p-6 mb-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">For Customers</h2>
            <ul className="space-y-3 text-gray-600">
              <li className="flex gap-3">
                <span className="text-red-500">•</span>
                <span><strong>Respect boundaries</strong> — Always respect the provider's stated limits and boundaries.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-red-500">•</span>
                <span><strong>Be on time</strong> — Being late is disrespectful and may result in a shortened or cancelled meeting.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-red-500">•</span>
                <span><strong>Don't haggle</strong> — Prices are set by providers. Negotiating is disrespectful.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-red-500">•</span>
                <span><strong>Maintain hygiene</strong> — Shower before meetings and maintain good personal hygiene.</span>
              </li>
            </ul>
          </section>

          <section className="bg-white rounded-xl p-6 mb-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Online Safety</h2>
            <ul className="space-y-3 text-gray-600">
              <li className="flex gap-3">
                <span className="text-red-500">•</span>
                <span><strong>Use strong passwords</strong> — Create unique passwords for your account.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-red-500">•</span>
                <span><strong>Beware of phishing</strong> — We will never ask for your password via email or message.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-red-500">•</span>
                <span><strong>Don't click suspicious links</strong> — Be cautious of links sent by other users.</span>
              </li>
            </ul>
          </section>

          <section className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
            <h2 className="text-xl font-semibold text-red-800 mb-4">🚨 Emergency Resources</h2>
            <p className="text-red-700 mb-4">
              If you are in immediate danger, contact emergency services in your country.
            </p>
            <ul className="space-y-2 text-red-700">
              <li><strong>Denmark:</strong> 112 (Emergency) | 114 (Police non-emergency)</li>
              <li><strong>Sweden:</strong> 112</li>
              <li><strong>Norway:</strong> 112</li>
              <li><strong>Germany:</strong> 110 (Police) | 112 (Emergency)</li>
              <li><strong>UK:</strong> 999</li>
            </ul>
          </section>

          <section className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Report Human Trafficking</h2>
            <p className="text-gray-600 mb-4">
              RedLightAD has a zero-tolerance policy for human trafficking and exploitation. If you suspect someone is being trafficked or exploited:
            </p>
            <ul className="space-y-2 text-gray-600">
              <li>• <strong>EU Anti-Trafficking Hotline:</strong> +32 2 299 11 11</li>
              <li>• <strong>National Human Trafficking Hotline (US):</strong> 1-888-373-7888</li>
              <li>• <strong>Report to us:</strong> <a href="/report" className="text-red-600 hover:underline">redlightad.com/report</a></li>
            </ul>
          </section>

          <div className="mt-8 flex gap-4">
            <a href="/terms" className="text-red-600 hover:underline text-sm">Terms of Service</a>
            <a href="/privacy" className="text-red-600 hover:underline text-sm">Privacy Policy</a>
            <a href="/support" className="text-red-600 hover:underline text-sm">Contact Support</a>
          </div>
        </div>
      </main>
    </>
  )
}
