"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"

interface LockedItem {
  id: string
  title: string
  description: string | null
  coin_price: number
  media_urls: string[]
  media_types: string[]
  seller_id: string
}

interface Props {
  listingId: string
}

export default function LockedContentSection({ listingId }: Props) {
  const router = useRouter()
  const [items, setItems] = useState<LockedItem[]>([])
  const [purchasedIds, setPurchasedIds] = useState<Set<string>>(new Set())
  const [userId, setUserId] = useState<string | null>(null)
  const [coinBalance, setCoinBalance] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [buyingId, setBuyingId] = useState<string | null>(null)
  const [coinModal, setCoinModal] = useState<{ needed: number } | null>(null)

  useEffect(() => {
    const supabase = createClient()

    async function load() {
      // Fetch locked content for this listing
      const { data: contentItems } = await supabase
        .from("locked_content")
        .select("id, title, description, coin_price, media_urls, media_types, seller_id")
        .eq("listing_id", listingId)
        .order("created_at", { ascending: false })

      if (!contentItems || contentItems.length === 0) {
        setLoading(false)
        return
      }
      setItems(contentItems)

      // Check auth
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)

        // Fetch purchases
        const contentIds = contentItems.map(i => i.id)
        const { data: purchases } = await supabase
          .from("content_purchases")
          .select("content_id")
          .eq("buyer_id", user.id)
          .in("content_id", contentIds)

        setPurchasedIds(new Set((purchases || []).map((p: { content_id: string }) => p.content_id)))

        // Fetch wallet
        const { data: wallet } = await supabase
          .from("wallets")
          .select("balance")
          .eq("user_id", user.id)
          .maybeSingle()

        setCoinBalance(wallet?.balance ?? 0)
      }

      setLoading(false)
    }

    load()
  }, [listingId])

  const handleUnlock = async (item: LockedItem) => {
    if (!userId) { router.push("/login"); return }
    if (coinBalance < item.coin_price) {
      setCoinModal({ needed: item.coin_price })
      return
    }

    setBuyingId(item.id)
    try {
      const res = await fetch("/api/coins/purchase-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentId: item.id, buyerId: userId }),
      })
      const data = await res.json()

      if (data.ok) {
        setPurchasedIds(prev => new Set([...prev, item.id]))
        setCoinBalance(prev => prev - item.coin_price)
      } else if (data.error === "insufficient_coins") {
        setCoinModal({ needed: item.coin_price })
      }
    } catch {
      alert("Fejl ved køb — prøv igen")
    }
    setBuyingId(null)
  }

  if (loading || items.length === 0) return null

  return (
    <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5 mt-6">
      <div className="flex items-center gap-2 mb-5">
        <span className="text-lg">🔴</span>
        <h3 className="text-base font-bold text-gray-900">Eksklusivt indhold</h3>
        <span className="ml-auto text-xs text-gray-400">{items.length} {items.length === 1 ? "item" : "items"}</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {items.map(item => {
          const isOwner = userId === item.seller_id
          const isPurchased = purchasedIds.has(item.id) || isOwner
          const firstMedia = item.media_urls?.[0]
          const firstType = item.media_types?.[0]

          return (
            <div key={item.id} className="rounded-xl border border-gray-100 overflow-hidden bg-gray-50">
              {/* Media preview */}
              {firstMedia && (
                <div className="relative h-44 overflow-hidden bg-gray-900">
                  {firstType === "video" ? (
                    isPurchased ? (
                      <video src={firstMedia} controls className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <video src={firstMedia} className="w-full h-full object-cover blur-sm scale-110 opacity-60" muted />
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                          <span className="text-3xl">🔒</span>
                          <span className="bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                            🔴 {item.coin_price} coins
                          </span>
                        </div>
                      </>
                    )
                  ) : (
                    isPurchased ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={firstMedia} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={firstMedia} alt={item.title} className="w-full h-full object-cover blur-sm scale-110 opacity-60" />
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                          <span className="text-3xl">🔒</span>
                          <span className="bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                            🔴 {item.coin_price} coins
                          </span>
                        </div>
                      </>
                    )
                  )}

                  {/* All media when unlocked */}
                  {isPurchased && item.media_urls.length > 1 && (
                    <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                      +{item.media_urls.length - 1} mere
                    </div>
                  )}
                </div>
              )}

              {/* Show all unlocked media */}
              {isPurchased && item.media_urls.length > 1 && (
                <div className="grid grid-cols-3 gap-1 p-2">
                  {item.media_urls.slice(1).map((url, i) => (
                    item.media_types[i + 1] === "video" ? (
                      <video key={i} src={url} controls className="rounded w-full h-20 object-cover" />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={i} src={url} alt="" className="rounded w-full h-20 object-cover" />
                    )
                  ))}
                </div>
              )}

              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                  {isPurchased && (
                    <span className="flex-shrink-0 text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full">✓ Låst op</span>
                  )}
                </div>
                {item.description && (
                  <p className="text-xs text-gray-500 mb-3">{item.description}</p>
                )}
                {!isPurchased && (
                  <button
                    onClick={() => handleUnlock(item)}
                    disabled={buyingId === item.id}
                    className="w-full bg-red-500 hover:bg-red-600 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-50"
                  >
                    {buyingId === item.id ? "..." : `Lås op for ${item.coin_price} 🔴`}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Insufficient coins modal */}
      {coinModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="text-center mb-4">
              <span className="text-4xl">🔴</span>
              <h3 className="text-lg font-bold text-gray-900 mt-2">Ikke nok coins</h3>
              <p className="text-gray-500 text-sm mt-1">
                Du har <strong>{coinBalance}</strong> coins — du mangler <strong>{coinModal.needed - coinBalance}</strong> mere
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setCoinModal(null)}
                className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-medium"
              >
                Annuller
              </button>
              <Link
                href="/dashboard/buy-coins"
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl text-sm font-semibold text-center transition-colors"
              >
                Køb coins
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
