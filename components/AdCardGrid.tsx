"use client"
import Link from "next/link"
import { CheckCircle } from "lucide-react"
import { useState, useEffect } from "react"

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

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

interface AdCardGridProps {
  id: string | number
  title: string
  display_name?: string | null
  image: string
  images?: string[] | null
  profileVideoUrl?: string | null
  verified: boolean
  age?: number | null
  city?: string | null
  country?: string | null
  location?: string
  category?: string
  created_at?: string
  opening_hours?: Record<string, { open: string; close: string; closed: boolean }> | null
  timezone?: string | null
  premium_tier?: string | null
  hasStory?: boolean
  onStoryClick?: () => void
  staggerDelay?: number
  social_links?: Record<string, { url?: string }> | null
}

export default function AdCardGrid({
  id, title, display_name, image, images, profileVideoUrl, verified, age, city, country, location,
  category, created_at, opening_hours, timezone, premium_tier,
  hasStory = false, onStoryClick, staggerDelay = 0, social_links,
}: AdCardGridProps) {
  const displayTitle = display_name
    ? `${display_name}${age ? `, ${age}` : ""}`
    : title
  const locationDisplay = [city, country].filter(Boolean).join(", ") || location || ""
  const available = isAvailableNow(opening_hours, timezone)
  const ago = created_at ? timeAgo(created_at) : ""

  // ── Cycling images ────────────────────────────────────────────────────────
  const pool = [image, ...(images ?? [])].filter((v, i, a) => v && a.indexOf(v) === i)
  const [currentImg, setCurrentImg] = useState(image)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    if (pool.length <= 1) return
    // Stagger: wait staggerDelay before starting the cycle
    const startTimer = setTimeout(() => {
      const interval = setInterval(() => {
        setFading(true)
        setTimeout(() => {
          setCurrentImg(prev => {
            const idx = pool.indexOf(prev)
            let next: number
            do { next = Math.floor(Math.random() * pool.length) } while (next === idx)
            return pool[next]
          })
          setFading(false)
        }, 500)
      }, 6000)
      return () => clearInterval(interval)
    }, staggerDelay)
    return () => clearTimeout(startTimer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pool.length, staggerDelay])
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <Link href={`/ads/${id}`} style={{ display: "block", textDecoration: "none" }}>
      {/* YDRE container — position: relative, overflow: visible */}
      <div
        className="group"
        style={{
          position: "relative",
          border: (premium_tier === "vip" || premium_tier === "featured" || premium_tier === "basic")
            ? "1px solid rgba(220,38,38,0.3)"
            : "1px solid #E5E7EB",
          background: "#fff",
          borderRadius: 0,
          overflow: "visible",
          transition: "transform 0.2s ease, box-shadow 0.2s ease",
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"
          ;(e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 24px rgba(0,0,0,0.12)"
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"
          ;(e.currentTarget as HTMLDivElement).style.boxShadow = "none"
        }}
      >
        {/* BILLEDE — overflow: hidden */}
        <div style={{ position: "relative", aspectRatio: "3/4", overflow: "hidden", background: "#D1D5DB" }}>
          {profileVideoUrl ? (
            <video
              src={profileVideoUrl}
              autoPlay
              muted
              loop
              playsInline
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={currentImg}
            alt={title}
            style={{
              width: "100%", height: "100%", objectFit: "cover", display: "block",
              transition: "opacity 0.5s ease, transform 0.3s ease",
              opacity: fading ? 0 : 1,
            }}
            className="group-hover:scale-105"
          />
          )}

          {/* Available dot — top left */}
          {available && (
            <div style={{
              position: "absolute", top: 8, left: 8,
              width: 8, height: 8, borderRadius: "50%",
              background: "#22C55E", boxShadow: "0 0 0 2px white",
            }} />
          )}

          {/* Verified badge — top right */}
          {verified && (
            <div style={{
              position: "absolute", top: 8, right: 8,
              background: "rgba(0,0,0,0.6)", color: "#fff",
              fontSize: 10, fontWeight: 700, letterSpacing: "0.05em",
              padding: "2px 6px",
            }}>✓ VERIFIED</div>
          )}

          {/* Premium badge */}
          {(premium_tier === "vip" || premium_tier === "featured" || premium_tier === "basic") && (
            <div style={{
              position: "absolute", top: available ? 24 : 8, left: 8,
              fontSize: 10, fontWeight: 600, letterSpacing: "0.8px",
              padding: "3px 8px", textTransform: "uppercase",
              background: "#111", color: "#fff",
            }}>PREMIUM</div>
          )}
          {/* OnlyFans badge */}
          {social_links?.onlyfans?.url && (
            <div style={{
              position: "absolute", bottom: 8, right: 8,
              display: "flex", alignItems: "center", gap: 4,
              background: "rgba(0,175,240,0.92)", backdropFilter: "blur(4px)",
              borderRadius: 20, padding: "3px 8px",
            }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="white">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 4c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm0 14c-2.67 0-8-1.34-8-4v-2c0-2.66 5.33-4 8-4s8 1.34 8 4v2c0 2.66-5.33 4-8 4z"/>
              </svg>
              <span style={{ fontSize: 9, fontWeight: 800, color: "#fff", letterSpacing: "0.05em" }}>OF</span>
            </div>
          )}
        </div>

        {/* CIRKEL — absolut relativt til YDRE container */}
        <div
          onClick={hasStory ? (e) => { e.preventDefault(); e.stopPropagation(); onStoryClick?.() } : undefined}
          style={{
            position: "absolute",
            bottom: 98,
            left: "50%",
            transform: "translateX(-50%)",
            width: 64,
            height: 64,
            borderRadius: "50%",
            border: "3px solid transparent",
            backgroundImage: hasStory
              ? "linear-gradient(white, white), linear-gradient(135deg, #DC2626, #F59E0B)"
              : "linear-gradient(white, white), linear-gradient(white, white)",
            backgroundOrigin: "border-box",
            backgroundClip: "padding-box, border-box",
            overflow: "hidden",
            zIndex: 10,
            boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
            cursor: hasStory ? "pointer" : "default",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image}
            alt={title}
            style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%", display: "block" }}
          />
        </div>

        {/* TEKST sektion */}
        <div style={{ paddingTop: 40, paddingBottom: 12, paddingLeft: 12, paddingRight: 12, background: "white" }}>

          {/* Navn + verified ikon */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
            <p style={{
              fontSize: 14, fontWeight: 700, color: "#111111",
              margin: 0, lineHeight: 1.3,
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              maxWidth: "calc(100% - 20px)",
            }}>{displayTitle}</p>
            {verified && <CheckCircle size={13} color="#DC2626" style={{ flexShrink: 0 }} />}
          </div>

          {/* By + land */}
          {locationDisplay && (
            <p style={{
              fontSize: 11, color: "#999999", textAlign: "center", marginTop: 2,
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>{locationDisplay}</p>
          )}

          {/* Divider */}
          <div style={{ height: 1, background: "#F3F4F6", margin: "10px 0" }} />

          {/* Kategori + posted */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            {category ? (
              <span style={{
                fontSize: 11, color: "#888888",
                background: "#F5F5F7", padding: "2px 8px",
                whiteSpace: "nowrap",
              }}>{category}</span>
            ) : <span />}
            {ago && (
              <span style={{ fontSize: 11, color: "#BBBBBB", whiteSpace: "nowrap" }}>{ago}</span>
            )}
          </div>

        </div>
      </div>
    </Link>
  )
}
