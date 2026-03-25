"use client"
import Link from "next/link"
import Image from "next/image"
import { CheckCircle } from "lucide-react"

function isAvailableNow(
  hours: Record<string, { open: string; close: string; closed: boolean }> | null | undefined,
  tz: string | null | undefined
): boolean {
  if (!hours || !tz) return false
  try {
    const day = new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "long" }).format(new Date()).toLowerCase()
    const h = hours[day]
    if (!h || h.closed) return false
    const now = new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date())
    const [ch, cm] = now.split(":").map(Number)
    const [oh, om] = h.open.split(":").map(Number)
    const [clh, clm] = h.close.split(":").map(Number)
    return (ch * 60 + cm) >= (oh * 60 + om) && (ch * 60 + cm) < (clh * 60 + clm)
  } catch { return false }
}

interface AdCardGridProps {
  id: string | number
  title: string
  image: string
  verified: boolean
  age: number
  city?: string | null
  country?: string | null
  location?: string
  opening_hours?: Record<string, { open: string; close: string; closed: boolean }> | null
  timezone?: string | null
  premium_tier?: string | null
  hasStory?: boolean
  onStoryClick?: () => void
}

export default function AdCardGrid({
  id, title, image, verified, age, city, country, location,
  opening_hours, timezone, premium_tier, hasStory = false, onStoryClick,
}: AdCardGridProps) {
  const locationDisplay = city || country || location || ""
  const available = isAvailableNow(opening_hours, timezone)

  return (
    <div className="group" style={{ display: "flex", flexDirection: "column", borderRadius: 0 }}>
      {/* ── Image area ── */}
      <Link href={`/ads/${id}`} style={{ display: "block", position: "relative" }}>
        <div style={{ position: "relative", width: "100%", aspectRatio: "3/4", overflow: "hidden", background: "#D1D5DB" }}>
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 25vw"
          />

          {/* Available dot — top left */}
          {available && (
            <div style={{
              position: "absolute", top: 8, left: 8,
              width: 10, height: 10, borderRadius: "50%",
              background: "#4ADE80", boxShadow: "0 0 0 2px white",
            }} />
          )}

          {/* Verified badge — top right */}
          {verified && (
            <div style={{ position: "absolute", top: 8, right: 8 }}>
              <CheckCircle size={16} color="white" style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.5))" }} />
            </div>
          )}

          {/* VIP badge */}
          {premium_tier === "vip" && (
            <div style={{
              position: "absolute", top: 8, left: available ? 24 : 8,
              fontSize: 9, fontWeight: 700, letterSpacing: "0.15em",
              padding: "2px 6px", backgroundColor: "rgba(0,0,0,0.75)",
              color: "#D4AF37", border: "1px solid rgba(212,175,55,0.4)",
            }}>VIP</div>
          )}

          {/* Profile circle — bottom left, half outside image */}
          <div
            onClick={hasStory ? (e) => { e.preventDefault(); onStoryClick?.() } : undefined}
            style={{
              position: "absolute", bottom: -24, left: 10,
              width: 52, height: 52,
              borderRadius: "50%",
              padding: hasStory ? 2 : 0,
              background: hasStory
                ? "linear-gradient(135deg, #DC2626, #F59E0B)"
                : "transparent",
              cursor: hasStory ? "pointer" : "default",
              zIndex: 10,
              flexShrink: 0,
            }}
          >
            <div style={{
              width: "100%", height: "100%", borderRadius: "50%",
              overflow: "hidden", border: "2px solid white",
              background: "#D1D5DB",
            }}>
              <Image
                src={image}
                alt={title}
                width={52}
                height={52}
                style={{ objectFit: "cover", width: "100%", height: "100%" }}
              />
            </div>
          </div>
        </div>
      </Link>

      {/* ── Info area (below image, accounts for circle overhang) ── */}
      <Link href={`/ads/${id}`} style={{ display: "block", textDecoration: "none" }}>
        <div style={{
          background: "white", paddingTop: 30, paddingBottom: 8,
          paddingLeft: 10, paddingRight: 10, borderTop: "none",
        }}>
          <p style={{
            fontWeight: 700, fontSize: 13, color: "#111827",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            lineHeight: "1.2",
          }}>{title}</p>
          {locationDisplay && (
            <p style={{
              fontSize: 11, color: "#9CA3AF", marginTop: 2,
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>{locationDisplay}</p>
          )}
        </div>
      </Link>
    </div>
  )
}
