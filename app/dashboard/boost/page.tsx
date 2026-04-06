"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase"
import DashboardLayout from "@/components/DashboardLayout"
import { PREMIUM_PACKAGES, BOOST_PACKAGES } from "@/lib/spendPackages"
import Link from "next/link"

interface Listing {
  id: string
  title: string
  premium_tier: string | null
  premium_until: string | null
  boost_expires_at: string | null
}

export default function BoostPage() {
  const [listings, setListings] = useState<Listing[]>([])
  const [selectedListing, setSelectedListing] = useState<string>("")
  const [balance, setBalance] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [buyingId, setBuyingId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null)
  const [userId, setUserId] = useState<string>("")

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setUserId(user.id)

      const [{ data: walletData }, { data: listingsData }] = await Promise.all([
        supabase.from("wallets").select("balance").eq("user_id", user.id).single(),
        supabase.from("listings").select("id, title, premium_tier, premium_until, boost_expires_at").eq("user_id", user.id).eq("status", "active"),
      ])

      setBalance(walletData?.balance ?? 0)
      setListings(listingsData ?? [])
      if (listingsData && listingsData.length > 0) {
        setSelectedListing(listingsData[0].id)
      }
      setLoading(false)
    }
    load()
  }, [])

  const activeListing = listings.find(l => l.id === selectedListing)
  const isPremiumActive = activeListing?.premium_until && new Date(activeListing.premium_until) > new Date()
  const isBoostActive = activeListing?.boost_expires_at && new Date(activeListing.boost_expires_at) > new Date()

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 4000)
  }

  const handleBuy = async (packageId: string) => {
    if (!selectedListing || !userId) return
    setBuyingId(packageId)

    try {
      const res = await fetch("/api/boost/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId, listingId: selectedListing, userId }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 402) {
          showToast("error", "Ikke nok Red Coins.")
        } else {
          showToast("error", data.error || "Noget gik galt")
        }
        setBuyingId(null)
        return
      }

      // Opdater lokalt
      const premiumPkg = PREMIUM_PACKAGES.find(p => p.id === packageId)
      const boostPkg = BOOST_PACKAGES.find(p => p.id === packageId)
      const pkg = premiumPkg || boostPkg

      setBalance(prev => prev - (pkg?.coins ?? 0))
      setListings(prev => prev.map(l => {
        if (l.id !== selectedListing) return l
        if (premiumPkg) {
          return { ...l, premium_tier: "vip", premium_until: data.expires_at }
        }
        if (boostPkg) {
          return { ...l, boost_expires_at: data.expires_at }
        }
        return l
      }))

      showToast("success", premiumPkg
        ? "Aktiveret! Din profil er nu Premium VIP"
        : "Aktiveret! Din profil er nu Boosted til toppen"
      )
    } catch {
      showToast("error", "Netværksfejl — prøv igen")
    }

    setBuyingId(null)
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString("da-DK", { day: "numeric", month: "long", year: "numeric" })

  const timeLeft = (d: string) => {
    const diff = new Date(d).getTime() - Date.now()
    if (diff <= 0) return null
    const hours = Math.floor(diff / 3600000)
    const mins = Math.floor((diff % 3600000) / 60000)
    return hours > 0 ? `${hours}t ${mins}m tilbage` : `${mins}m tilbage`
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Toast */}
        {toast && (
          <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium ${toast.type === "success" ? "bg-green-500" : "bg-red-500"}`}>
            {toast.msg}
            {toast.type === "error" && (
              <Link href="/dashboard/buy-coins" className="ml-2 underline font-bold">Køb coins</Link>
            )}
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Premium & Boost</h1>
            <p className="text-gray-500 text-sm mt-1">Brug dine Red Coins til at komme øverst</p>
          </div>
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-2">
            <span className="text-red-500 text-lg font-bold">{balance.toLocaleString()}</span>
            <span className="text-red-400 text-sm">Red Coins</span>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-7 h-7 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg font-medium mb-2">Ingen aktive annoncer</p>
            <Link href="/opret-annonce" className="text-red-500 underline">Opret en annonce først</Link>
          </div>
        ) : (
          <>
            {/* Listing selector */}
            {listings.length > 1 && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Vælg annonce</label>
                <select
                  value={selectedListing}
                  onChange={e => setSelectedListing(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white"
                >
                  {listings.map(l => (
                    <option key={l.id} value={l.id}>{l.title}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Status badges */}
            <div className="flex gap-3 flex-wrap">
              <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${isPremiumActive ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-500"}`}>
                {isPremiumActive ? `VIP til ${formatDate(activeListing!.premium_until!)}` : "Standard profil"}
              </span>
              {isBoostActive && (
                <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-red-100 text-red-600">
                  Boosted — {timeLeft(activeListing!.boost_expires_at!)}
                </span>
              )}
            </div>

            {/* ── Premium Sektion ── */}
            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-1">Premium Profil</h2>
              <p className="text-gray-500 text-sm mb-5">Premium profiler vises automatisk øverst på forsiden</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {PREMIUM_PACKAGES.map(pkg => (
                  <div key={pkg.id} className={`relative bg-white rounded-2xl border-2 p-5 flex flex-col items-center text-center transition-all hover:shadow-md ${pkg.popular ? "border-red-400 shadow-md" : "border-gray-100"}`}>
                    {pkg.popular && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-red-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wide">Mest Populær</span>
                    )}
                    {pkg.discount > 0 && (
                      <span className="absolute top-3 right-3 bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full">-{pkg.discount}%</span>
                    )}
                    <p className="text-gray-900 font-bold text-base mt-2">{pkg.label}</p>
                    <p className="text-red-500 text-3xl font-extrabold mt-3">{pkg.coins.toLocaleString()}</p>
                    <p className="text-gray-400 text-xs mt-1">Red Coins</p>
                    <p className="text-gray-400 text-xs mt-1">{Math.round(pkg.coins / pkg.months)} coins/md</p>
                    <button
                      onClick={() => handleBuy(pkg.id)}
                      disabled={buyingId !== null}
                      className="mt-4 w-full py-3 rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
                      style={{ background: "#EF4444", color: "#fff" }}
                    >
                      {buyingId === pkg.id ? (
                        <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        `Køb for ${pkg.coins.toLocaleString()} coins`
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* ── Push to Top Sektion ── */}
            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-1">Push to Top</h2>
              <p className="text-gray-500 text-sm mb-5">Hop til absolut toppen — over alle premium profiler</p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {BOOST_PACKAGES.map(pkg => (
                  <div key={pkg.id} className={`relative bg-white rounded-2xl border-2 p-5 flex flex-col items-center text-center transition-all hover:shadow-md ${("popular" in pkg && pkg.popular) ? "border-red-400 shadow-md" : "border-gray-100"}`}>
                    {"popular" in pkg && pkg.popular && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-red-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wide">Mest Populær</span>
                    )}
                    <p className="text-gray-900 font-bold text-base mt-2">{pkg.label}</p>
                    <p className="text-red-500 text-3xl font-extrabold mt-3">{pkg.coins}</p>
                    <p className="text-gray-400 text-xs mt-1">Red Coins</p>
                    <p className="text-gray-400 text-xs mt-3">Din profil vil ligge #1 på forsiden i {pkg.label.toLowerCase()}</p>
                    <button
                      onClick={() => handleBuy(pkg.id)}
                      disabled={buyingId !== null}
                      className="mt-4 w-full py-3 rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
                      style={{ background: "#EF4444", color: "#fff" }}
                    >
                      {buyingId === pkg.id ? (
                        <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        `Boost for ${pkg.coins} coins`
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* ── Hvordan det virker ── */}
            <section>
              <h2 className="text-lg font-bold text-gray-900 mb-5">Hvordan det virker</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl border border-gray-100 p-5 text-center">
                  <div className="text-3xl mb-3">&#x1F193;</div>
                  <p className="font-bold text-gray-900 mb-1">Gratis profil</p>
                  <p className="text-gray-500 text-sm">Vises normalt i listen</p>
                </div>
                <div className="bg-white rounded-2xl border border-yellow-200 p-5 text-center">
                  <div className="text-3xl mb-3">&#x2B50;</div>
                  <p className="font-bold text-gray-900 mb-1">Premium profil</p>
                  <p className="text-gray-500 text-sm">Vises øverst, VIP badge</p>
                </div>
                <div className="bg-white rounded-2xl border border-red-200 p-5 text-center">
                  <div className="text-3xl mb-3">&#x1F680;</div>
                  <p className="font-bold text-gray-900 mb-1">Push to Top</p>
                  <p className="text-gray-500 text-sm">Absolut #1 position, midlertidigt</p>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
