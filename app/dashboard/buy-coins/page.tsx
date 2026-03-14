"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import DashboardLayout from "@/components/DashboardLayout"
import { COIN_PACKAGES } from "@/lib/coinPackages"

export default function BuyCoinsPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    createClient().auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.replace("/login"); return }
      setUserId(user.id)
    })
  }, [router])

  const handleBuy = async (packageId: string) => {
    if (!userId) return
    setLoading(packageId)
    try {
      const res = await fetch("/api/coins/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId, userId }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch {
      alert("Fejl ved oprettelse af betaling")
    }
    setLoading(null)
  }

  return (
    <DashboardLayout>
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Køb RedCoins</h1>
        <p className="text-gray-500 text-sm mb-8">Brug coins til at låse op for eksklusivt indhold</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {COIN_PACKAGES.map((pkg) => (
            <div
              key={pkg.id}
              className={`relative bg-white rounded-2xl border p-6 flex flex-col items-center text-center shadow-sm transition-shadow hover:shadow-md ${
                pkg.popular ? "border-red-500 ring-2 ring-red-500/20" : "border-gray-100"
              }`}
            >
              {pkg.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                  Mest populær
                </span>
              )}
              <div className="text-4xl font-black text-red-500 mb-1">{pkg.coins}</div>
              <div className="text-sm font-semibold text-gray-500 mb-4">RedCoins</div>
              <div className="text-2xl font-bold text-gray-900 mb-1">${pkg.price_usd}</div>
              <div className="text-xs text-gray-400 mb-6">${(pkg.price_usd / pkg.coins).toFixed(3)} per coin</div>
              <button
                onClick={() => handleBuy(pkg.id)}
                disabled={loading === pkg.id}
                className={`w-full py-3 rounded-xl text-sm font-semibold transition-colors ${
                  pkg.popular
                    ? "bg-red-500 hover:bg-red-600 text-white"
                    : "bg-gray-900 hover:bg-black text-white"
                } disabled:opacity-50`}
              >
                {loading === pkg.id ? "..." : "Køb nu"}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-8 bg-gray-50 rounded-2xl p-5 text-sm text-gray-500">
          <p className="font-medium text-gray-700 mb-1">Sådan fungerer RedCoins</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>Coins bruges til at låse op for eksklusivt indhold fra annoncører</li>
            <li>Coins udløber aldrig</li>
            <li>Annoncører kan anmode om udbetaling af optjente coins</li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  )
}
