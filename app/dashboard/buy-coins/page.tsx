"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import DashboardLayout from "@/components/DashboardLayout"
import { COIN_PACKAGES } from "@/lib/coinPackages"
import { ShoppingBag, Lock, MessageSquare, TrendingUp, ChevronDown, Shield, AlertCircle } from "lucide-react"

type PaymentTab = "card" | "crypto"

const CRYPTO_MIN_EUR = 20

const FAQ_ITEMS = [
  { q: "Hvad er Red Coins?", a: "Red Coins er RedLightADs interne valuta. Du køber coins én gang og bruger dem på tværs af hele platformen — til indhold, tips og marketplace-køb." },
  { q: "Hvad koster 1 Red Coin?", a: "1 Red Coin har en face value på €0.10. Du får rabat jo flere du køber — op til 38% rabat på den største pakke." },
  { q: "Hvad vises på mit kontoudtog?", a: "Betalingen vises diskret på dit kontoudtog. Vi afslører aldrig platformens navn direkte." },
  { q: "Udløber mine Red Coins?", a: "Nej. Dine Red Coins udløber aldrig og forbliver på din konto indtil du bruger dem." },
  { q: "Kan jeg få refunderet mine coins?", a: "Red Coins er ikke-refunderbare efter køb. Vær sikker på at du vil bruge dem inden du køber." },
  { q: "Hvad er crypto-betaling?", a: "Du kan betale med Bitcoin, Ethereum, USDC og andre kryptovalutaer. Betalingen er anonym og hurtig." },
  { q: "Jeg er sælger — hvad får jeg?", a: "Som sælger modtager du 80% af Red Coin-værdien for alt hvad du sælger. Minimum udbetaling er 500 coins (€40)." },
  { q: "Hvordan anmoder jeg om udbetaling?", a: "Gå til din wallet og anmod om udbetaling. Vi behandler udbetalinger indenfor 3-5 hverdage." },
]

const USE_CASES = [
  { icon: ShoppingBag, title: "Marketplace", desc: "Køb fysiske og digitale varer fra sælgere" },
  { icon: Lock,        title: "Eksklusivt indhold", desc: "Få adgang til premium og låst indhold" },
  { icon: MessageSquare, title: "Tips", desc: "Send tips til dine favorit-annoncører" },
  { icon: TrendingUp,  title: "Boost profil", desc: "Fremhæv dine annoncer øverst på platformen" },
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
      else alert(data.error || "Fejl ved oprettelse af betaling")
    } catch {
      alert("Fejl ved oprettelse af betaling")
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
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">RedLightAD</span>
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">Red Coins</h1>
          <p className="text-gray-400 text-base">Platformens officielle valuta — køb én gang, brug overalt</p>
          {balance !== null && (
            <div className="inline-flex items-center gap-3 bg-white border border-gray-100 rounded-2xl px-6 py-3 mt-5 shadow-sm">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span className="text-2xl font-black text-gray-900">{balance.toLocaleString()}</span>
              <span className="text-sm text-gray-400 font-medium">RC tilgængelige</span>
            </div>
          )}
        </div>

        {/* First purchase bonus */}
        {isFirstPurchase && (
          <div className="mb-8 rounded-2xl bg-gray-900 px-6 py-5 text-center border border-gray-800">
            <div className="text-xs font-bold text-red-400 uppercase tracking-widest mb-1">Eksklusivt tilbud</div>
            <p className="text-white text-lg font-bold mb-1">+25% ekstra coins på dit første køb</p>
            <p className="text-gray-500 text-sm">Automatisk tilføjet — kun ved dit allerførste køb</p>
          </div>
        )}

        {/* Payment tabs */}
        <div className="flex gap-2 mb-3">
          <div className="flex-1 py-3 rounded-xl text-sm font-semibold bg-gray-50 border border-gray-200 text-gray-300 text-center cursor-not-allowed flex items-center justify-center gap-2">
            <span className="text-xs">KORT</span>
            <span className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full font-medium">Snart</span>
          </div>
          <button
            onClick={() => setTab("crypto")}
            className="flex-1 py-3 rounded-xl text-sm font-bold transition-all bg-white border-2 border-gray-900 text-gray-900 shadow-sm hover:bg-gray-900 hover:text-white"
          >
            Crypto
          </button>
        </div>
        <p className="text-xs text-gray-400 text-center mb-6">
          Betaling via SegPay kommer snart — betal nu med crypto anonymt og hurtigt
        </p>

        {/* Crypto minimum notice */}
        {tab === "crypto" && (
          <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-6 text-sm text-gray-600">
            <AlertCircle size={15} className="text-gray-400 shrink-0" />
            <span>Crypto kræver minimum <strong className="text-gray-900">€{CRYPTO_MIN_EUR}</strong> pr. transaktion. Pakker under dette beløb er ikke tilgængelige med crypto.</span>
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
                    <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-3">Mest populær</span>
                  )}
                  {cryptoDisabled && (
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Ikke tilgængelig</span>
                  )}
                  {!pkg.popular && !cryptoDisabled && <div className="mb-3 h-4" />}
                  <div className="text-xs font-semibold text-gray-300 uppercase tracking-widest mb-3">{pkg.label}</div>
                  <div className="text-4xl font-black text-gray-900 mb-0.5">{pkg.coins.toLocaleString()}</div>
                  <div className="text-sm text-gray-400 font-medium mb-5">Red Coins</div>
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
                    ) : cryptoDisabled ? "Min. €" + CRYPTO_MIN_EUR : "Køb nu"}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Use cases */}
        <div className="mb-12">
          <h2 className="text-lg font-bold text-gray-900 mb-6 text-center tracking-tight">Hvad kan du bruge Red Coins til?</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {USE_CASES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white border border-gray-100 rounded-2xl p-5 text-center hover:border-gray-200 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto mb-3">
                  <Icon size={16} className="text-gray-600" strokeWidth={1.8} />
                </div>
                <div className="font-semibold text-gray-900 text-sm mb-1">{title}</div>
                <div className="text-xs text-gray-400 leading-relaxed">{desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="mb-12">
          <h2 className="text-lg font-bold text-gray-900 mb-5 text-center tracking-tight">Ofte stillede spørgsmål</h2>
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
        <div className="flex items-center justify-center gap-2.5 py-4 text-sm text-gray-400 mb-6">
          <Shield size={14} className="text-gray-300" strokeWidth={1.8} />
          Diskret betaling — dit køb vises fortroligt på dit kontoudtog
        </div>

      </div>
    </DashboardLayout>
  )
}
