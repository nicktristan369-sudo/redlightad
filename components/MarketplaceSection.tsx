"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

const TYPE_LABELS: Record<string, string> = {
  video: "🎬 VIDEO",
  photos: "📸 PHOTOS",
  cam_show: "📹 CAM SHOW",
  dick_rating: "⭐ DICK RATING",
  underwear: "👙 UNDERWEAR",
  sex_toy: "🧸 SEX TOY",
  custom_video: "💌 CUSTOM VIDEO",
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
      .then(data => {
        setItems(data.items || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [listingId])

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
        alert("Purchase successful!")
      } else if (data.error === "insufficient_coins") {
        alert("Not enough RedCoins. Buy more at /dashboard/coins")
      } else if (data.error === "already_purchased") {
        alert("You already purchased this item.")
      } else {
        alert(data.error || "Purchase failed")
      }
    } catch {
      alert("Error — please try again")
    }
    setBuyingId(null)
  }

  if (loading || items.length === 0) return null

  return (
    <div>
      <div style={{ borderTop: "1px solid #E5E7EB", paddingTop: 20, marginBottom: 14 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "#111", margin: 0 }}>
          Marketplace
        </h2>
        <p style={{ fontSize: 13, color: "#999", marginTop: 4 }}>
          Purchase exclusive content with RedCoins
        </p>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)",
        gap: 12,
      }}>
        {items.map(item => (
          <div key={item.id} style={{ border: "1px solid #E5E7EB", overflow: "hidden" }}>
            {/* Preview area */}
            <div style={{
              aspectRatio: "1/1",
              position: "relative",
              overflow: "hidden",
              background: item.preview_url ? undefined : "#1A1A1A",
            }}>
              {item.preview_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.preview_url}
                  alt=""
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    filter: "blur(16px)",
                    transform: "scale(1.1)",
                  }}
                />
              )}
              {/* Type badge */}
              <span style={{
                position: "absolute",
                top: 8,
                left: 8,
                background: "#111",
                color: "#fff",
                fontSize: 9,
                fontWeight: 600,
                textTransform: "uppercase",
                padding: "3px 6px",
                letterSpacing: "0.05em",
              }}>
                {TYPE_LABELS[item.type] || item.type}
              </span>
              {/* Lock icon */}
              <div style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
            </div>

            {/* Info */}
            <div style={{ padding: 12, background: "#fff" }}>
              <div style={{
                fontSize: 13,
                fontWeight: 600,
                color: "#111",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}>
                {item.title}
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#DC2626", marginTop: 4 }}>
                {item.price_redcoins} RedCoins
              </div>
              <button
                onClick={() => handleBuy(item.id)}
                disabled={buyingId === item.id}
                style={{
                  width: "100%",
                  marginTop: 8,
                  padding: 8,
                  background: "#111",
                  color: "#fff",
                  fontSize: 11,
                  fontWeight: 600,
                  border: "none",
                  borderRadius: 0,
                  cursor: "pointer",
                  opacity: buyingId === item.id ? 0.5 : 1,
                }}
              >
                {buyingId === item.id ? "..." : isLoggedIn ? "Buy Now" : "Login to Buy"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Responsive: 3 cols on desktop */}
      <style>{`
        @media (min-width: 768px) {
          .marketplace-grid { grid-template-columns: repeat(3, 1fr) !important; }
        }
      `}</style>
    </div>
  )
}
