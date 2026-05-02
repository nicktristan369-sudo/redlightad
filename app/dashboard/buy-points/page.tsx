"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase"
import DashboardLayout from "@/components/DashboardLayout"
import { Check, Shield, Zap, TrendingUp, ArrowLeft, Star } from "lucide-react"
import { Suspense } from "react"

// ── Point pakker — samme durationer som membership ─────────────────────────
const POINT_PACKAGES = [
  {
    id: "points_1m",
    label: "1 Month",
    months: 1,
    points: 50,
    price: 4.99,
    pricePerPoint: 0.10,
    saving: null,
    popular: false,
  },
  {
    id: "points_3m",
    label: "3 Months",
    months: 3,
    points: 175,
    price: 12.99,
    pricePerPoint: 0.074,
    saving: "25% off",
    popular: false,
  },
  {
    id: "points_6m",
    label: "6 Months",
    months: 6,
    points: 400,
    price: 24.99,
    pricePerPoint: 0.062,
    saving: "38% off",
    popular: true,
  },
  {
    id: "points_12m",
    label: "12 Months",
    months: 12,
    points: 900,
    price: 44.99,
    pricePerPoint: 0.050,
    saving: "50% off",
    popular: false,
  },
]

function BuyPointsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnTo = searchParams?.get("returnTo") || "/dashboard/boost"

  const [selectedPackage, setSelectedPackage] = useState<string | null>(null)
  const [buying, setBuying] = useState(false)
  const [balance, setBalance] = useState<number | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.replace("/login"); return }
      setUserId(user.id)
      const { data: wallet } = await supabase.from("wallets").select("balance").eq("user_id", user.id).maybeSingle()
      setBalance(wallet?.balance ?? 0)
    })
  }, [router])

  const selectedPkg = POINT_PACKAGES.find(p => p.id === selectedPackage)

  const handleBuy = async () => {
    if (!selectedPkg || !userId) return
    setBuying(true)

    try {
      const res = await fetch("/api/points/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId: selectedPkg.id, userId }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else alert(data.error || "Payment error")
    } catch {
      alert("Network error — try again")
    }

    setBuying(false)
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto px-4 pb-20">

        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors mt-2 mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 bg-red-50 text-red-600 text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
            <TrendingUp className="h-3.5 w-3.5" />
            BUY POINTS — PUSH TO TOP
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3 tracking-tight">
            Get more visibility
          </h1>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            Use points to push your profile to the top. More points = more exposure.
          </p>

          {/* Balance indicator */}
          {balance !== null && (
            <div className="inline-flex items-center gap-3 bg-white border border-gray-100 rounded-2xl px-6 py-3 mt-6 shadow-sm">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span className="text-2xl font-black text-gray-900">{balance.toLocaleString()}</span>
              <span className="text-sm text-gray-500 font-medium">points available</span>
            </div>
          )}
        </div>

        {/* Stats row */}
        <div className="flex items-center justify-center gap-10 mb-12">
          {[
            { value: "#1", label: "Top placement" },
            { value: "1 pt", label: "= 1 push to top" },
            { value: "Instant", label: "After purchase" },
          ].map(stat => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl font-black text-gray-900">{stat.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* ── Package cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {POINT_PACKAGES.map((pkg) => {
            const isSelected = selectedPackage === pkg.id
            return (
              <button
                key={pkg.id}
                onClick={() => setSelectedPackage(pkg.id)}
                className={`relative text-left rounded-2xl border-2 p-6 transition-all ${
                  isSelected
                    ? "border-red-500 bg-white shadow-xl ring-1 ring-red-500"
                    : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                }`}
              >
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-black tracking-widest bg-red-600 text-white whitespace-nowrap">
                    BEST VALUE
                  </div>
                )}

                {/* Duration label */}
                <p className="text-xs font-bold tracking-widest text-gray-500 mb-3">
                  {pkg.label.toUpperCase()}
                </p>

                {/* Points */}
                <div className="text-4xl font-black text-gray-900 mb-0.5">
                  {pkg.points}
                </div>
                <p className="text-sm text-gray-500 mb-3">points</p>

                {/* Price */}
                <div className="text-2xl font-bold text-red-600 mb-1">€{pkg.price}</div>
                <p className="text-xs text-gray-500 mb-3">€{pkg.pricePerPoint.toFixed(3)}/point</p>

                {/* Saving badge */}
                {pkg.saving ? (
                  <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                    {pkg.saving}
                  </span>
                ) : (
                  <span className="inline-block text-xs text-gray-500">Standard price</span>
                )}

                {/* Selected checkmark */}
                {isSelected && (
                  <div className="absolute top-4 right-4 w-5 h-5 rounded-full bg-red-600 flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" strokeWidth={3} />
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {/* ── Price comparison table ── */}
        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6 mb-8">
          <p className="text-xs font-bold tracking-widest text-gray-500 mb-4">PRICE COMPARISON</p>
          <div className="space-y-2">
            {POINT_PACKAGES.map((pkg) => {
              const isSelected = selectedPackage === pkg.id
              return (
                <div
                  key={pkg.id}
                  className={`flex items-center justify-between py-2 px-3 rounded-xl transition-colors cursor-pointer ${
                    isSelected ? "bg-white shadow-sm" : "hover:bg-white/60"
                  }`}
                  onClick={() => setSelectedPackage(pkg.id)}
                >
                  <span className={`text-sm font-medium ${isSelected ? "text-gray-900" : "text-gray-500"}`}>
                    {pkg.label}
                  </span>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500">{pkg.points} pts</span>
                    <span className={`text-sm font-bold ${isSelected ? "text-gray-900" : "text-gray-600"}`}>
                      €{pkg.price}
                    </span>
                    {pkg.saving && (
                      <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                        {pkg.saving}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── CTA ── */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            ← Cancel
          </button>
          <button
            onClick={handleBuy}
            disabled={!selectedPackage || buying}
            className="w-full sm:flex-1 py-4 rounded-xl text-sm font-bold transition-all bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-600/25 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {buying ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Loading...
              </span>
            ) : selectedPkg ? (
              `Buy ${selectedPkg.points} points for €${selectedPkg.price} →`
            ) : (
              "Select a package to continue"
            )}
          </button>
        </div>

        {/* ── What are points ── */}
        <div className="rounded-2xl border border-gray-100 bg-white p-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-4 h-4 text-red-500" />
            <p className="text-sm font-bold text-gray-900">What are points?</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-3xl mb-2">🚀</div>
              <p className="font-semibold text-gray-900 text-sm mb-1">Push to Top</p>
              <p className="text-xs text-gray-500">1 point = move your profile to position #1 instantly</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">⚡</div>
              <p className="font-semibold text-gray-900 text-sm mb-1">Instant effect</p>
              <p className="text-xs text-gray-500">Your profile appears first in search & categories</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">♾️</div>
              <p className="font-semibold text-gray-900 text-sm mb-1">Never expire</p>
              <p className="text-xs text-gray-500">Points stay in your account until you use them</p>
            </div>
          </div>
        </div>

        {/* Trust bar */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 text-sm text-gray-500">
          <div className="flex items-center gap-2"><Shield className="h-4 w-4" /><span>One-time payment — no subscription</span></div>
          <div className="hidden md:block w-px h-4 bg-gray-200" />
          <div className="flex items-center gap-2"><Check className="h-4 w-4" /><span>Anonymous crypto payment accepted</span></div>
          <div className="hidden md:block w-px h-4 bg-gray-200" />
          <div className="flex items-center gap-2"><Zap className="h-4 w-4" /><span>Points added instantly after payment</span></div>
        </div>

      </div>
    </DashboardLayout>
  )
}

export default function BuyPointsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-7 h-7 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <BuyPointsContent />
    </Suspense>
  )
}
