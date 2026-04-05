"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import DashboardLayout from "@/components/DashboardLayout"
import { COIN_PACKAGES } from "@/lib/coinPackages"

type PaymentTab = "card" | "crypto"

const FAQ_ITEMS = [
  {
    q: "Hvad er Red Coins?",
    a: "Red Coins er RedLightADs interne valuta. Du køber coins én gang og bruger dem på tværs af hele platformen — til indhold, tips og marketplace-køb.",
  },
  {
    q: "Hvad koster 1 Red Coin?",
    a: "1 Red Coin har en face value på €0.10. Du får rabat jo flere du køber — op til 38% rabat på den største pakke.",
  },
  {
    q: "Hvad vises på mit kontoudtog?",
    a: "Betalingen vises diskret på dit kontoudtog. Vi afslører aldrig platformens navn direkte.",
  },
  {
    q: "Udløber mine Red Coins?",
    a: "Nej. Dine Red Coins udløber aldrig og forbliver på din konto indtil du bruger dem.",
  },
  {
    q: "Kan jeg få refunderet mine coins?",
    a: "Red Coins er ikke-refunderbare efter køb. Vær sikker på at du vil bruge dem inden du køber.",
  },
  {
    q: "Hvad er crypto-betaling?",
    a: "Du kan betale med Bitcoin (BTC), Ethereum (ETH), USDC og andre kryptovalutaer. Betalingen er anonym og hurtig.",
  },
  {
    q: "Jeg er sælger — hvad får jeg?",
    a: "Som sælger modtager du 80% af Red Coin-værdien for alt hvad du sælger. Minimum udbetaling er 500 coins (€40).",
  },
  {
    q: "Hvordan anmoder jeg om udbetaling?",
    a: "Gå til din wallet → \"Anmod om udbetaling\". Vi behandler udbetalinger indenfor 3-5 hverdage.",
  },
]

const USE_CASES = [
  { icon: "🛒", title: "Køb på Marketplace", desc: "Køb fysiske og digitale varer fra sælgere" },
  { icon: "🔓", title: "Lås indhold op", desc: "Få adgang til eksklusivt premium indhold" },
  { icon: "💬", title: "Tip annoncører", desc: "Send tips til dine favorit-annoncører" },
  { icon: "🚀", title: "Boost din profil", desc: "Sælgere kan booste deres annoncer til toppen" },
]

export default function BuyCoinsPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [balance, setBalance] = useState<number | null>(null)
  const [isFirstPurchase, setIsFirstPurchase] = useState(true)
  const [tab, setTab] = useState<PaymentTab>("crypto")
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.replace("/login"); return }
      setUserId(user.id)

      // Fetch balance
      const { data: profile } = await supabase
        .from("profiles")
        .select("red_coins")
        .eq("id", user.id)
        .single()
      if (profile) setBalance(profile.red_coins ?? 0)

      // Check first purchase
      const { count, error } = await supabase
        .from("coin_purchases")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
      if (!error && count !== null) {
        setIsFirstPurchase(count === 0)
      }
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
      else alert(data.error || "Fejl ved oprettelse af betaling")
    } catch {
      alert("Fejl ved oprettelse af betaling")
    }
    setLoading(null)
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-2">
            🔴 Red Coins
          </h1>
          <p className="text-gray-500 text-base sm:text-lg mb-4">
            Den nemmeste måde at betale på RedLightAD
          </p>
          {balance !== null && (
            <div className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-full px-5 py-2.5 shadow-sm">
              <span className="w-5 h-5 rounded-full bg-red-500 inline-block" />
              <span className="text-lg font-bold text-gray-900">{balance.toLocaleString()}</span>
              <span className="text-sm text-gray-500">Red Coins</span>
            </div>
          )}
        </div>

        {/* First purchase bonus */}
        {isFirstPurchase && (
          <div className="mb-6 rounded-2xl bg-gradient-to-r from-red-500 via-red-600 to-amber-500 p-4 sm:p-5 text-center text-white shadow-lg">
            <p className="text-lg sm:text-xl font-bold">
              🎁 Første køb: +25% BONUS coins
            </p>
            <p className="text-sm text-white/80 mt-1">
              Ekstra coins oven i din første pakke — kun ved dit allerførste køb!
            </p>
          </div>
        )}

        {/* Payment tabs */}
        <div className="flex gap-2 mb-6">
          <div
            className="flex-1 py-3 rounded-xl text-sm font-semibold bg-gray-100 border-2 border-transparent text-gray-400 text-center cursor-not-allowed relative"
            title="Kortbetaling kommer snart"
          >
            💳 Kort &amp; Debet
            <span className="ml-2 text-xs bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded-full">Snart</span>
          </div>
          <button
            onClick={() => setTab("crypto")}
            className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all bg-white border-2 border-red-500 text-red-600 shadow-sm"
          >
            ₿ Crypto
          </button>
        </div>
        <p className="text-xs text-gray-400 text-center -mt-4 mb-6">
          Kortbetaling via SegPay kommer snart. Betal nu med crypto — hurtigt og anonymt.
        </p>

        {/* Package grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {COIN_PACKAGES.map((pkg) => (
            <div
              key={pkg.id}
              className={`relative bg-white rounded-2xl border p-6 flex flex-col items-center text-center shadow-sm transition-shadow hover:shadow-md ${
                pkg.popular ? "border-red-500 ring-2 ring-red-500/20" : "border-gray-100"
              }`}
            >
              {pkg.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-red-500 text-white text-[11px] font-bold uppercase tracking-wide px-3 py-1 rounded-full whitespace-nowrap">
                  Mest Populær
                </span>
              )}
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                {pkg.label}
              </div>
              <div className="text-4xl font-black text-red-500 mb-0.5">{pkg.coins.toLocaleString()}</div>
              <div className="text-sm font-semibold text-gray-500 mb-4">RedCoins</div>
              <div className="text-2xl font-bold text-gray-900 mb-1">€{pkg.price_eur}</div>
              <div className="text-xs text-gray-400 mb-5">€{pkg.per_coin.toFixed(3)} per coin</div>
              <button
                onClick={() => handleBuy(pkg.id)}
                disabled={loading === pkg.id}
                className={`w-full py-3 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
                  pkg.popular
                    ? "bg-red-500 hover:bg-red-600 text-white"
                    : "bg-gray-900 hover:bg-black text-white"
                } disabled:opacity-50`}
              >
                {loading === pkg.id ? (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                ) : (
                  "Køb nu"
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Use cases */}
        <div className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-4 text-center">
            Hvad kan du bruge Red Coins til?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {USE_CASES.map((item) => (
              <div
                key={item.title}
                className="bg-white border border-gray-100 rounded-2xl p-5 text-center shadow-sm"
              >
                <div className="text-3xl mb-2">{item.icon}</div>
                <div className="font-semibold text-gray-900 mb-1">{item.title}</div>
                <div className="text-sm text-gray-500">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-4 text-center">
            Ofte stillede spørgsmål
          </h2>
          <div className="space-y-2">
            {FAQ_ITEMS.map((item, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left"
                >
                  <span className="font-semibold text-gray-900 text-sm">{item.q}</span>
                  <svg
                    className={`w-4 h-4 text-gray-400 transition-transform shrink-0 ml-2 ${
                      openFaq === i ? "rotate-180" : ""
                    }`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Discreet billing notice */}
        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 text-center text-sm text-gray-500 mb-6">
          🔒 Diskret betaling — dit køb vises diskret på dit kontoudtog. Vi tager din privatlivssikkerhed seriøst.
        </div>
      </div>
    </DashboardLayout>
  )
}
