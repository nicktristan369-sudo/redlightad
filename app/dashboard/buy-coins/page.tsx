"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import DashboardLayout from "@/components/DashboardLayout"
import { COIN_PACKAGES } from "@/lib/coinPackages"
import { ShoppingBag, Lock, MessageSquare, TrendingUp, ChevronDown, Shield, AlertCircle } from "lucide-react"
import { CardBadges, CryptoBadges } from "@/components/PaymentMethodBadges"

type PaymentTab = "card" | "crypto"

const CRYPTO_MIN_EUR = 20

const FAQ_ITEMS = [
  { q: "What are Red Coins?", a: "Red Coins are RedLightAD's internal currency. You buy coins once and use them across the entire platform — for content, tips, and marketplace purchases." },
  { q: "What does 1 Red Coin cost?", a: "1 Red Coin has a face value of €0.10. You get a discount the more you buy — up to 38% off on the largest package." },
  { q: "What appears on my bank statement?", a: "The payment appears discreetly on your bank statement. We never reveal the platform's name directly." },
  { q: "Do my Red Coins expire?", a: "No. Your Red Coins never expire and remain in your account until you use them." },
  { q: "Can I get a refund on my coins?", a: "Red Coins are non-refundable after purchase. Make sure you want to use them before buying." },
  { q: "What is crypto payment?", a: "You can pay with Bitcoin, Ethereum, USDC, and other cryptocurrencies. Payment is anonymous and fast." },
  { q: "I'm a seller — what do I get?", a: "As a seller, you receive 80% of the Red Coin value for everything you sell. Minimum payout is 500 coins (€40)." },
  { q: "How do I request a payout?", a: "Go to your wallet and request a payout. We process payouts within 3–5 business days." },
]

const USE_CASES = [
  { icon: ShoppingBag, title: "Marketplace", desc: "Buy physical and digital goods from sellers" },
  { icon: Lock,        title: "Exclusive Content", desc: "Access premium and locked content" },
  { icon: MessageSquare, title: "Tips", desc: "Send tips to your favorite advertisers" },
  { icon: TrendingUp,  title: "Boost Profile", desc: "Highlight your listings at the top of the platform" },
]

export default function BuyCoinsPage() {
  const router = useRouter()
  const [tab, setTab] = useState<PaymentTab>("crypto")
  const [loading, setLoading] = useState<string | null>(null)
  const [balance, setBalance] = useState<number | null>(null)
  const [isFirstPurchase, setIsFirstPurchase] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.replace("/login"); return }
      setUserId(user.id)
      const { data: profile } = await supabase.from("customer_profiles").select("red_coins").eq("user_id", user.id).maybeSingle()
      if (profile) setBalance(profile.red_coins ?? 0)
      const { count, error } = await supabase.from("coin_purchases").select("id", { count: "exact", head: true }).eq("user_id", user.id)
      if (!error && count !== null) setIsFirstPurchase(count === 0)
    })
  }, [router])

  const handleBuy = async (packageId: string) => {
    if (!userId) return
    setLoading(packageId)
    try {
      const endpoint = tab === "crypto" ? "/api/coins/crypto-checkout" : "/api/coins/checkout"
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId, userId }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else alert(data.error || "Error creating payment")
    } catch {
      alert("Error creating payment")
    }
    setLoading(null)
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-4">

        {/* Header */}
        <div className="text-center mb-10 pt-2">
          <div className="inline-flex items-center gap-2 mb-5">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">RedLightAD</span>
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">Red Coins</h1>
          <p className="text-gray-500 text-base">The platform's official currency — buy once, use everywhere</p>
          {balance !== null && (
            <div className="inline-flex items-center gap-3 bg-white border border-gray-100 rounded-2xl px-6 py-3 mt-5 shadow-sm">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span className="text-2xl font-black text-gray-900">{balance.toLocaleString()}</span>
              <span className="text-sm text-gray-500 font-medium">RC available</span>
            </div>
          )}
        </div>

        {/* First purchase bonus */}
        {isFirstPurchase && (
          <div className="mb-8 rounded-2xl bg-gray-900 px-6 py-5 text-center border border-gray-800">
            <div className="text-xs font-bold text-red-400 uppercase tracking-widest mb-1">Exclusive Offer</div>
            <p className="text-white text-lg font-bold mb-1">+25% extra coins on your first purchase</p>
            <p className="text-gray-500 text-sm">Automatically added — only on your very first purchase</p>
          </div>
        )}

        {/* Payment tabs */}
        <div className="flex gap-2 mb-3">
          <div className="flex-1 py-3 rounded-xl text-sm font-semibold bg-gray-50 border border-gray-200 text-gray-400 cursor-not-allowed flex items-center justify-center gap-3">
            <CardBadges />
            <span className="text-xs bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full font-medium">Soon</span>
          </div>
          <button
            onClick={() => setTab("crypto")}
            className="flex-1 py-3 rounded-xl text-sm font-bold transition-all bg-gray-900 border-2 border-gray-900 text-white flex items-center justify-center gap-3"
          >
            <CryptoBadges />
          </button>
        </div>
        <p className="text-xs text-gray-500 text-center mb-6">
          Payment via SegPay coming soon — pay now with crypto anonymously and fast
        </p>

        {/* Crypto minimum notice */}
        {tab === "crypto" && (
          <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-6 text-sm text-gray-600">
            <AlertCircle size={15} className="text-gray-500 shrink-0" />
            <span>Crypto requires a minimum of <strong className="text-gray-900">€{CRYPTO_MIN_EUR}</strong> per transaction. Packages below this amount are not available with crypto.</span>
          </div>
        )}

        {/* Package grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {COIN_PACKAGES.map((pkg) => {
            const cryptoDisabled = tab === "crypto" && pkg.price_eur < CRYPTO_MIN_EUR
            return (
              <div key={pkg.id} className={`relative bg-white rounded-2xl border flex flex-col items-center text-center transition-all ${
                cryptoDisabled ? "opacity-40 cursor-not-allowed border-gray-100" :
                pkg.popular ? "border-gray-900 shadow-lg" : "border-gray-100 hover:border-gray-300 hover:shadow-sm"
              }`}>
                {pkg.popular && !cryptoDisabled && (
                  <div className="absolute -top-px left-0 right-0 h-0.5 bg-red-500 rounded-t-2xl" />
                )}
                <div className="p-6 w-full flex flex-col items-center">
                  {pkg.popular && !cryptoDisabled && (
                    <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-3">Most Popular</span>
                  )}
                  {cryptoDisabled && (
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Not available</span>
                  )}
                  {!pkg.popular && !cryptoDisabled && <div className="mb-3 h-4" />}
                  <div className="text-xs font-semibold text-gray-300 uppercase tracking-widest mb-3">{pkg.label}</div>
                  <div className="text-4xl font-black text-gray-900 mb-0.5">{pkg.coins.toLocaleString()}</div>
                  <div className="text-sm text-gray-500 font-medium mb-5">Red Coins</div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">€{pkg.price_eur}</div>
                  <div className="text-xs text-gray-300 mb-6">€{pkg.per_coin.toFixed(3)} per coin</div>
                  <button
                    onClick={() => !cryptoDisabled && handleBuy(pkg.id)}
                    disabled={loading === pkg.id || cryptoDisabled}
                    className={`w-full py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                      cryptoDisabled ? "bg-gray-100 text-gray-300 cursor-not-allowed" :
                      pkg.popular ? "bg-red-500 hover:bg-red-600 text-white" :
                      "bg-gray-900 hover:bg-black text-white"
                    }`}
                  >
                    {loading === pkg.id ? (
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                      </svg>
                    ) : cryptoDisabled ? "Min. €" + CRYPTO_MIN_EUR : "Buy now"}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Use cases */}
        <div className="mb-12">
          <h2 className="text-lg font-bold text-gray-900 mb-6 text-center tracking-tight">What can you use Red Coins for?</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {USE_CASES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white border border-gray-100 rounded-2xl p-5 text-center hover:border-gray-200 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto mb-3">
                  <Icon size={16} className="text-gray-600" strokeWidth={1.8} />
                </div>
                <div className="font-semibold text-gray-900 text-sm mb-1">{title}</div>
                <div className="text-xs text-gray-500 leading-relaxed">{desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="mb-12">
          <h2 className="text-lg font-bold text-gray-900 mb-5 text-center tracking-tight">Frequently Asked Questions</h2>
          <div className="space-y-1">
            {FAQ_ITEMS.map((item, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="font-semibold text-gray-900 text-sm">{item.q}</span>
                  <ChevronDown size={15} className={`text-gray-300 transition-transform shrink-0 ml-2 ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4 text-sm text-gray-500 leading-relaxed border-t border-gray-50">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Discreet billing */}
        <div className="flex items-center justify-center gap-2.5 py-4 text-sm text-gray-500 mb-6">
          <Shield size={14} className="text-gray-300" strokeWidth={1.8} />
          Discreet billing — your purchase appears confidentially on your statement
        </div>

      </div>
    </DashboardLayout>
  )
}
