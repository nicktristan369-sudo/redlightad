"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Video, ImageIcon, Monitor, Film, Star, ShoppingBag, Package } from "lucide-react"

const TYPE_META: Record<string, { label: string; Icon: React.ElementType }> = {
  video:        { label: "VIDEO",        Icon: Video },
  photos:       { label: "PHOTOS",       Icon: ImageIcon },
  cam_show:     { label: "CAM SHOW",     Icon: Monitor },
  custom_video: { label: "CUSTOM VIDEO", Icon: Film },
  dick_rating:  { label: "DICK RATING",  Icon: Star },
  underwear:    { label: "UNDERWEAR",    Icon: ShoppingBag },
  sex_toy:      { label: "SEX TOY",      Icon: Package },
}

interface MarketplaceItem {
  id: string
  type: string
  title: string
  description: string | null
  price_redcoins: number
  preview_url: string | null
  is_available: boolean
}

interface Props {
  listingId: string
  isLoggedIn: boolean
}

export default function MarketplaceSection({ listingId, isLoggedIn }: Props) {
  const router = useRouter()
  const [items, setItems] = useState<MarketplaceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [buyingId, setBuyingId] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/marketplace?listing_id=${listingId}`)
      .then(r => r.json())
      .then(data => { setItems(data.items || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [listingId])

  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null)

  const showToast = (msg: string, type: "ok" | "err") => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const handleBuy = async (itemId: string) => {
    if (!isLoggedIn) {
      router.push("/login")
      return
    }
    setBuyingId(itemId)
    try {
      const res = await fetch("/api/marketplace/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item_id: itemId }),
      })
      const data = await res.json()
      if (data.ok) {
        showToast("Purchase successful! Check your purchases.", "ok")
      } else if (data.error === "insufficient_coins") {
        showToast("Not enough RedCoins — top up your balance.", "err")
        setTimeout(() => router.push("/kunde/buy-coins"), 2000)
      } else if (data.error === "already_purchased") {
        showToast("You already own this item.", "err")
      } else if (data.error === "Unauthorized" || data.error === "unauthorized") {
        showToast("Please sign in with a customer account.", "err")
        setTimeout(() => router.push("/login"), 2000)
      } else {
        showToast(data.error || "Purchase failed — please try again.", "err")
      }
    } catch {
      showToast("Connection error — please try again.", "err")
    }
    setBuyingId(null)
  }

  if (loading || items.length === 0) return null

  return (
    <div style={{ position: "relative" }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
          background: toast.type === "ok" ? "#10B981" : "#DC2626",
          color: "#fff", padding: "12px 20px", borderRadius: 12,
          fontSize: 13, fontWeight: 600, zIndex: 9999,
          boxShadow: "0 8px 24px rgba(0,0,0,0.2)", whiteSpace: "nowrap",
        }}>
          {toast.msg}
        </div>
      )}
      <div style={{ borderTop: "1px solid #E5E7EB", paddingTop: 20, marginBottom: 14 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "#111", margin: 0 }}>Marketplace</h2>
        <p style={{ fontSize: 13, color: "#999", marginTop: 4, margin: "4px 0 0" }}>
          Purchase exclusive content with RedCoins
        </p>
      </div>

      <div className="marketplace-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
        {items.map(item => {
          const meta = TYPE_META[item.type]
          const Icon = meta?.Icon ?? Package
          const label = meta?.label ?? item.type.toUpperCase()

          return (
            <div key={item.id} style={{ border: "1px solid #E5E7EB", overflow: "hidden" }}>
              {/* Preview */}
              <div style={{ aspectRatio: "1/1", position: "relative", overflow: "hidden", background: "#1A1A1A" }}>
                {item.preview_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.preview_url}
                    alt=""
                    style={{ width: "100%", height: "100%", objectFit: "cover", filter: "blur(8px) brightness(0.7)", transform: "scale(1.12)" }}
                  />
                )}
                {/* Type badge */}
                <div style={{
                  position: "absolute", top: 8, left: 8,
                  display: "flex", alignItems: "center", gap: 4,
                  background: "rgba(0,0,0,0.6)", color: "#fff",
                  fontSize: 10, fontWeight: 600, letterSpacing: "0.05em",
                  textTransform: "uppercase", padding: "3px 8px",
                }}>
                  <Icon size={12} />
                  {label}
                </div>
                {/* Lock icon */}
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5">
                    <rect x="3" y="11" width="18" height="11" rx="0"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </div>
              </div>

              {/* Info */}
              <div style={{ padding: 12, background: "#fff" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#111", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {item.title}
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#DC2626", marginTop: 4 }}>
                  {item.price_redcoins} RedCoins
                </div>
                <button
                  onClick={() => handleBuy(item.id)}
                  disabled={buyingId === item.id}
                  style={{ width: "100%", marginTop: 8, padding: 8, background: "#111", color: "#fff", fontSize: 11, fontWeight: 600, border: "none", borderRadius: 0, cursor: "pointer", opacity: buyingId === item.id ? 0.5 : 1 }}
                >
                  {buyingId === item.id ? "..." : isLoggedIn ? "Buy Now" : "Login to Buy"}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `@media (min-width: 768px) { .marketplace-grid { grid-template-columns: repeat(3, 1fr) !important; } }` }} />
    </div>
  )
}
