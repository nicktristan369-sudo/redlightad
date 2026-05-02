"use client"
import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { PLANS } from "@/lib/plans"
import Navbar from "@/components/Navbar"
import { Suspense } from "react"

function PremiumContent() {
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState("")
  const searchParams = useSearchParams()
  const listingId = searchParams.get("listing") || ""

  const handleUpgrade = async (tier: string) => {
    setLoading(tier)
    setError("")
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier, listingId }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else throw new Error(data.error || "Error")
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Noget gik galt")
      setLoading(null)
    }
  }

  const plans = [
    { key: "basic", ...PLANS.basic },
    { key: "featured", ...PLANS.featured },
    { key: "vip", ...PLANS.vip },
  ]

  return (
    <div className="bg-gray-50 min-h-screen">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Premium Plan</h1>
          <p className="text-gray-500 text-lg">Nå flere kunder og få mere synlighed</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-8 text-center text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isFeatured = plan.key === "featured"
            const isVip = plan.key === "vip"
            return (
              <div
                key={plan.key}
                className={`bg-white rounded-2xl shadow-sm border-2 p-8 flex flex-col relative ${
                  isVip
                    ? "border-yellow-400 shadow-yellow-100"
                    : isFeatured
                    ? "border-blue-500 shadow-blue-100"
                    : "border-gray-200"
                }`}
              >
                {isFeatured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-xs font-bold px-4 py-1 rounded-full">
                    MEST POPULÆR
                  </div>
                )}
                {isVip && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-gray-900 text-xs font-bold px-4 py-1 rounded-full">
                    PREMIUM
                  </div>
                )}

                <div className="mb-6">
                  <div className="text-3xl mb-2">
                    {isVip ? "👑" : isFeatured ? "⭐" : "📋"}
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">{plan.name}</h2>
                  <div className="mt-3">
                    <span className="text-4xl font-bold text-gray-900">{plan.priceDisplay}</span>
                    <span className="text-gray-500 text-sm">/måned</span>
                  </div>
                </div>

                <ul className="space-y-3 flex-1 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="text-green-500 font-bold flex-shrink-0">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleUpgrade(plan.key)}
                  disabled={loading === plan.key}
                  className={`w-full py-3 rounded-xl font-semibold text-sm transition-colors disabled:opacity-60 ${
                    isVip
                      ? "bg-yellow-400 hover:bg-yellow-500 text-gray-900"
                      : isFeatured
                      ? "bg-blue-500 hover:bg-blue-600 text-white"
                      : "bg-gray-900 hover:bg-gray-800 text-white"
                  }`}
                >
                  {loading === plan.key ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Behandler...
                    </span>
                  ) : (
                    `Choose ${plan.name}`
                  )}
                </button>
              </div>
            )
          })}
        </div>

        <p className="text-center text-xs text-gray-400 mt-8">
          Secure payment via Stripe • Test mode active • Use card 4242 4242 4242 4242
        </p>
      </div>
    </div>
  )
}

export default function PremiumPage() {
  return (
    <Suspense>
      <PremiumContent />
    </Suspense>
  )
}
