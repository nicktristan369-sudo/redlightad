import Navbar from "@/components/Navbar"
import Link from "next/link"

export const metadata = {
  title: "Help Center | RedLightAD",
  description: "Find answers to common questions and get support for RedLightAD.",
}

const helpCategories = [
  {
    title: "Getting Started",
    icon: "🚀",
    items: [
      { q: "How do I create an account?", a: "Click 'Create Account' in the top right, choose your account type (Provider or Customer), and follow the registration steps." },
      { q: "What's the difference between Provider and Customer accounts?", a: "Providers can create listings and offer services. Customers can browse, purchase content, and contact providers." },
      { q: "How do I verify my profile?", a: "Go to Dashboard → Verification and follow the KYC process. Verified profiles get a blue checkmark and more visibility." },
    ]
  },
  {
    title: "RedCoins & Payments",
    icon: "💰",
    items: [
      { q: "What are RedCoins?", a: "RedCoins are our virtual currency used to unlock exclusive content, tip providers, and access premium features." },
      { q: "How do I buy RedCoins?", a: "Go to Dashboard → Buy Coins. We accept credit cards, crypto, and other payment methods via Stripe." },
      { q: "Can I get a refund on RedCoins?", a: "All RedCoin purchases are final. We cannot refund purchased coins, but unused coins remain in your wallet." },
      { q: "How do providers get paid?", a: "Providers can request payouts from their Wallet once they reach the minimum threshold. Payouts are processed within 5-7 business days." },
    ]
  },
  {
    title: "Listings & Profiles",
    icon: "📝",
    items: [
      { q: "How do I create a listing?", a: "Go to Dashboard → Create Profile. Fill in your details, upload photos, and submit for review. Most listings are approved within 24 hours." },
      { q: "Why was my listing rejected?", a: "Common reasons include: unclear photos, missing required information, or content that violates our terms. Check your email for specific feedback." },
      { q: "How do I edit my listing?", a: "Go to Dashboard → My Profile to update your information, photos, videos, and services." },
      { q: "How do I delete my listing?", a: "Go to Dashboard → Profile Settings and click 'Delete Listing'. This action cannot be undone." },
    ]
  },
  {
    title: "Premium & Boost",
    icon: "⭐",
    items: [
      { q: "What are the benefits of Premium?", a: "Premium profiles appear at the top of search results, get a Premium badge, can upload more photos/videos, and access exclusive features." },
      { q: "What's the difference between VIP, Featured, and Basic?", a: "VIP gets top placement and all features. Featured gets highlighted placement. Basic gets priority over free listings." },
      { q: "How long does a boost last?", a: "Boosts typically last 24-72 hours depending on the package purchased." },
    ]
  },
  {
    title: "REDLIGHTCAM",
    icon: "📹",
    items: [
      { q: "How do I go live?", a: "Go to Dashboard → Go Live. You'll need a webcam and microphone. Follow the setup wizard to start streaming." },
      { q: "How do I earn from live streams?", a: "Viewers can tip you with RedCoins during your stream. You can also set up private shows with custom pricing." },
      { q: "Can I save my streams?", a: "Yes! Go to Dashboard → Recordings to view and manage your saved streams." },
    ]
  },
  {
    title: "Safety & Privacy",
    icon: "🔒",
    items: [
      { q: "How do I report a user?", a: "Click the 'Report' button on any profile or message. Our team reviews all reports within 24 hours." },
      { q: "How do I block someone?", a: "Open the conversation with that user and click 'Block'. They won't be able to contact you again." },
      { q: "Is my data secure?", a: "Yes. We use encryption for all data, secure payment processing, and never share your personal information with third parties." },
    ]
  },
]

export default function HelpPage() {
  return (
    <>
      <Navbar />
      <main className="bg-[#F5F5F7] min-h-screen">
        <div className="mx-auto max-w-4xl px-4 py-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Help Center</h1>
          <p className="text-gray-600 mb-8">
            Find answers to common questions or contact our support team.
          </p>

          {/* Quick links */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            <Link href="/faq" className="bg-white rounded-xl p-4 text-center shadow-sm hover:shadow-md transition-shadow">
              <span className="text-2xl">❓</span>
              <p className="text-sm font-medium text-gray-900 mt-2">FAQ</p>
            </Link>
            <Link href="/contact" className="bg-white rounded-xl p-4 text-center shadow-sm hover:shadow-md transition-shadow">
              <span className="text-2xl">✉️</span>
              <p className="text-sm font-medium text-gray-900 mt-2">Contact Us</p>
            </Link>
            <Link href="/safety" className="bg-white rounded-xl p-4 text-center shadow-sm hover:shadow-md transition-shadow">
              <span className="text-2xl">🛡️</span>
              <p className="text-sm font-medium text-gray-900 mt-2">Safety Tips</p>
            </Link>
            <Link href="/report" className="bg-white rounded-xl p-4 text-center shadow-sm hover:shadow-md transition-shadow">
              <span className="text-2xl">🚨</span>
              <p className="text-sm font-medium text-gray-900 mt-2">Report Abuse</p>
            </Link>
          </div>

          {/* Help categories */}
          <div className="space-y-8">
            {helpCategories.map((category) => (
              <section key={category.title} className="bg-white rounded-xl p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span>{category.icon}</span>
                  {category.title}
                </h2>
                <div className="space-y-4">
                  {category.items.map((item, idx) => (
                    <details key={idx} className="group">
                      <summary className="cursor-pointer list-none flex items-center justify-between py-3 border-b border-gray-100 hover:text-red-600 transition-colors">
                        <span className="font-medium text-gray-900 group-hover:text-red-600">{item.q}</span>
                        <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                      </summary>
                      <p className="py-3 text-gray-600 text-sm">{item.a}</p>
                    </details>
                  ))}
                </div>
              </section>
            ))}
          </div>

          {/* Still need help */}
          <div className="mt-10 bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-8 text-center text-white">
            <h2 className="text-2xl font-bold mb-2">Still need help?</h2>
            <p className="mb-4 opacity-90">Our support team is here for you 24/7</p>
            <Link 
              href="/contact" 
              className="inline-block bg-white text-red-600 font-semibold px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Contact Support
            </Link>
          </div>

          <div className="mt-8 flex gap-4 justify-center">
            <Link href="/terms" className="text-red-600 hover:underline text-sm">Terms of Service</Link>
            <Link href="/privacy" className="text-red-600 hover:underline text-sm">Privacy Policy</Link>
            <Link href="/cookies" className="text-red-600 hover:underline text-sm">Cookie Policy</Link>
          </div>
        </div>
      </main>
    </>
  )
}
