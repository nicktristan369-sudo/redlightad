"use client"

import { useState } from "react"
import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"

const FAQ_ITEMS = [
  {
    q: "How do I create an ad?",
    a: "Click 'Post an Ad' in the navigation bar. You'll be guided through a simple 3-step process: add your basic info (title, category, location), fill in your details and pricing, then upload photos and contact information. Your ad will be reviewed and published within a few hours.",
  },
  {
    q: "How do I edit or delete my ad?",
    a: "Go to your Dashboard → My Ads. Click the edit icon next to the ad you want to modify, make your changes, and save. To delete, click the trash icon and confirm. Deleted ads are permanently removed.",
  },
  {
    q: "How do I contact a seller?",
    a: "On any ad page, you'll find the seller's preferred contact method — phone, WhatsApp, Telegram, or Snapchat. You can also use our built-in messaging system by clicking 'Send Message' on the ad. All messages are private and encrypted.",
  },
  {
    q: "Is it free to post an ad?",
    a: "Yes — posting a basic ad is completely free. We also offer premium plans (Featured and VIP) that give your ad higher visibility, more photos, and additional features. You can upgrade anytime from your dashboard.",
  },
  {
    q: "How do I protect myself from scams?",
    a: "Never send money, gift cards, or cryptocurrency upfront. Always meet in a safe, public place for in-person transactions. If a deal seems too good to be true, it probably is. Use our built-in messaging so all communication stays on platform. Report any suspicious profiles immediately using the report button on their ad.",
  },
  {
    q: "How do I buy RedCoins?",
    a: "Go to Dashboard → Buy Coins. Choose a coin package (100, 250, 500, or 1000 coins) and complete payment via Stripe. Coins are added to your wallet instantly and never expire. Use them to unlock exclusive content from sellers.",
  },
  {
    q: "How do I withdraw my earnings?",
    a: "Go to Dashboard → Wallet. If you have at least 500 coins earned from sales, click Request Withdrawal. Enter the amount and your IBAN bank account number. Our team processes withdrawals within 3-5 business days. The payout rate is $0.065 per coin.",
  },
  {
    q: "How do I verify my account?",
    a: "Account verification is available from your Profile Settings. Verified accounts receive a badge on their ads, increasing trust with buyers. The process requires a valid ID. Verification is free and takes up to 24 hours.",
  },
  {
    q: "How do I report a profile?",
    a: "On any ad or profile page, click the flag/report icon. Select the reason (inappropriate content, scam, fake profile, etc.) and add any details. Our moderation team reviews all reports within 24 hours. Repeat offenders are permanently banned.",
  },
]

const SUBJECT_OPTIONS = [
  "Report a Profile",
  "Payment Issue",
  "Account Verification",
  "Withdrawal Request",
  "Technical Problem",
  "General Question",
  "Other",
]

const CATEGORY_CARDS = [
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    title: "Getting Started",
    desc: "Learn how to post and manage your ads",
    href: "#faq",
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    ),
    title: "Messaging",
    desc: "Help with messages and buyer communication",
    href: "#faq",
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: "Safety & Security",
    desc: "Protect your account and trade safely",
    href: "#faq",
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "FAQ",
    desc: "Quick answers to common questions",
    href: "#faq",
  },
]

export default function SupportPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const filteredFaq = FAQ_ITEMS.filter(
    item =>
      !searchQuery ||
      item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.a.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    try {
      // Save to admin_inbox
      const { createClient } = await import("@/lib/supabase")
      const supabase = createClient()
      await supabase.from("admin_inbox").insert({
        from_name:  form.name,
        from_email: form.email,
        subject:    form.subject,
        message:    form.message,
        category:   "support",
      })
    } catch (_) { /* silent — don't block UX */ }
    setSent(true)
    setSending(false)
    setForm({ name: "", email: "", subject: "", message: "" })
  }

  return (
    <>
      <Navbar />

      {/* ── HERO ── */}
      <section className="bg-gray-950 relative overflow-hidden">
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        {/* Radial glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-red-950/20 via-transparent to-transparent" />

        <div className="relative mx-auto max-w-3xl px-4 py-20 text-center">
          <p className="text-red-500 text-xs font-semibold tracking-[0.2em] uppercase mb-4">Support Center</p>
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-4 leading-tight">
            How can we help you?
          </h1>
          <p className="text-gray-400 text-lg mb-10">
            Search our help center or contact our support team
          </p>
          <div className="relative max-w-xl mx-auto">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search for help..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-white/10 backdrop-blur border border-white/10 text-white placeholder-gray-500 rounded-full py-4 pl-12 pr-5 text-sm focus:outline-none focus:border-white/30 focus:bg-white/15 transition-all"
            />
          </div>
        </div>
      </section>

      {/* ── CATEGORY CARDS ── */}
      <section className="bg-[#F5F5F7] py-14">
        <div className="mx-auto max-w-5xl px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {CATEGORY_CARDS.map((card) => (
              <a
                key={card.title}
                href={card.href}
                className="group bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col items-center text-center hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mb-4 text-gray-700 group-hover:bg-gray-900 group-hover:text-white transition-colors duration-200">
                  {card.icon}
                </div>
                <p className="font-semibold text-gray-900 text-sm mb-1">{card.title}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{card.desc}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="bg-white py-16">
        <div className="mx-auto max-w-2xl px-4">
          <div className="text-center mb-10">
            <p className="text-red-500 text-xs font-semibold tracking-widest uppercase mb-3">FAQ</p>
            <h2 className="text-3xl font-black text-gray-900">Frequently Asked Questions</h2>
          </div>

          {filteredFaq.length === 0 ? (
            <p className="text-center text-gray-400 py-10">No results found for "{searchQuery}"</p>
          ) : (
            <div className="divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden">
              {filteredFaq.map((item, i) => (
                <div key={i} className="bg-white">
                  <button
                    onClick={() => setOpenIndex(openIndex === i ? null : i)}
                    className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-gray-50 transition-colors"
                  >
                    <span className="font-semibold text-gray-900 text-sm pr-4">{item.q}</span>
                    <span className={`flex-shrink-0 w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 transition-transform duration-200 ${openIndex === i ? "rotate-45 bg-gray-900 border-gray-900 text-white" : ""}`}>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                      </svg>
                    </span>
                  </button>
                  {openIndex === i && (
                    <div className="px-6 pb-5 text-sm text-gray-600 leading-relaxed border-t border-gray-50 bg-gray-50/50">
                      <p className="pt-4">{item.a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── CONTACT FORM ── */}
      <section className="bg-[#F5F5F7] py-16">
        <div className="mx-auto max-w-xl px-4">
          <div className="text-center mb-10">
            <p className="text-red-500 text-xs font-semibold tracking-widest uppercase mb-3">Get in Touch</p>
            <h2 className="text-3xl font-black text-gray-900">Contact Support</h2>
            <p className="text-gray-500 text-sm mt-2">We typically respond within 24 hours</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8">
            {sent ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Message sent</h3>
                <p className="text-gray-500 text-sm">We'll get back to you within 24 hours.</p>
                <button onClick={() => setSent(false)} className="mt-6 text-sm text-gray-500 hover:text-gray-700 underline underline-offset-2">
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1.5">Name *</label>
                    <input
                      required
                      type="text"
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="Your name"
                      className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-gray-400 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1.5">Email *</label>
                    <input
                      required
                      type="email"
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="you@example.com"
                      className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-gray-400 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">Subject *</label>
                  <select
                    required
                    value={form.subject}
                    onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-gray-400 transition-colors bg-white"
                  >
                    <option value="">Select a topic...</option>
                    {SUBJECT_OPTIONS.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">Message *</label>
                  <textarea
                    required
                    rows={5}
                    value={form.message}
                    onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                    placeholder="Describe your issue in detail..."
                    className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-gray-400 transition-colors resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={sending}
                  className="w-full bg-gray-900 hover:bg-black text-white font-semibold py-3.5 rounded-xl transition-colors disabled:opacity-60 text-sm mt-2"
                >
                  {sending ? "Sending..." : "Send Message"}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ── CONTACT CHANNELS ── */}
      <section className="bg-white py-16 border-t border-gray-100">
        <div className="mx-auto max-w-4xl px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-black text-gray-900">Other Ways to Reach Us</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {/* Email */}
            <div className="bg-[#F5F5F7] rounded-2xl p-6 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-gray-900 rounded-2xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="font-bold text-gray-900 mb-1">Email</p>
              <a href="mailto:contact@redlightad.com" className="text-sm text-gray-600 hover:text-red-500 transition-colors mb-3">
                contact@redlightad.com
              </a>
              <p className="text-xs text-gray-400">Response within 24 hours</p>
            </div>

            {/* Signal */}
            <div className="bg-[#F5F5F7] rounded-2xl p-6 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 overflow-hidden" style={{ backgroundColor: "#3A76F0" }}>
                <svg viewBox="0 0 48 48" className="w-7 h-7" fill="white">
                  <path d="M24 4C12.95 4 4 12.95 4 24s8.95 20 20 20 20-8.95 20-20S35.05 4 24 4zm0 8a8 8 0 110 16 8 8 0 010-16zm0 22c-4.42 0-8.39-1.79-11.27-4.68.18-.37.46-.75.87-1.12C15.81 26.57 19.7 25 24 25s8.19 1.57 10.4 3.2c.41.37.69.75.87 1.12C32.39 32.21 28.42 34 24 34z"/>
                </svg>
              </div>
              <p className="font-bold text-gray-900 mb-1">Signal</p>
              <p className="text-sm text-gray-600 mb-3">Chat with us on Signal</p>
              <a
                href="https://signal.me/#p/+X333x.27"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-white px-5 py-2.5 rounded-full transition-colors"
                style={{ backgroundColor: "#3A76F0" }}
              >
                Open Signal Chat
              </a>
            </div>

            {/* Live Chat */}
            <div className="bg-[#F5F5F7] rounded-2xl p-6 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-gray-900 rounded-2xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                </svg>
              </div>
              <p className="font-bold text-gray-900 mb-1">Live Chat</p>
              <p className="text-sm text-gray-600 mb-1">Available 9:00 - 21:00</p>
              <p className="text-xs text-gray-400 mb-3">Mon–Sun, CET</p>
              <button className="text-sm font-semibold bg-gray-900 hover:bg-black text-white px-5 py-2.5 rounded-full transition-colors">
                Chat with us now
              </button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}
