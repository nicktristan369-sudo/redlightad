"use client"
import Link from "next/link"
import Image from "next/image"

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
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes rlad-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.35); }
        }
      `}} />

      <div
        className="group"
        style={{
          display: "flex", flexDirection: "column",
          border: "1px solid #E5E7EB", borderRadius: 0,
          overflow: "visible", background: "white",
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
        {/* ── Image ── */}
        <Link href={`/ads/${id}`} style={{ display: "block", position: "relative", flexShrink: 0 }}>
          <div style={{ position: "relative", width: "100%", aspectRatio: "3/4", overflow: "hidden", background: "#D1D5DB" }}>
            <Image
              src={image}
              alt={title}
              fill
              style={{ objectFit: "cover", transition: "transform 0.3s ease" }}
              className="group-hover:scale-105"
              sizes="(max-width:640px) 50vw, 25vw"
            />

            {/* Dark gradient overlay */}
            <div style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.2) 40%, transparent 70%)",
              pointerEvents: "none",
            }} />

            {/* Available dot — top left */}
            {available && (
              <div style={{
                position: "absolute", top: 8, left: 8,
                width: 8, height: 8, borderRadius: "50%",
                background: "#22C55E", boxShadow: "0 0 0 2px white",
                animation: "rlad-pulse 1.8s ease-in-out infinite",
              }} />
            )}

            {/* Verified badge — top right */}
            {verified && (
              <div style={{
                position: "absolute", top: 8, right: 8,
                background: "rgba(0,0,0,0.6)", color: "#fff",
                fontSize: 10, fontWeight: 700, letterSpacing: "0.05em",
                padding: "2px 6px",
              }}>
                ✓ VERIFIED
              </div>
            )}

            {/* VIP badge */}
            {premium_tier === "vip" && (
              <div style={{
                position: "absolute", top: available ? 26 : 8, left: 8,
                fontSize: 9, fontWeight: 700, letterSpacing: "0.15em",
                padding: "2px 6px",
                backgroundColor: "rgba(0,0,0,0.75)", color: "#D4AF37",
                border: "1px solid rgba(212,175,55,0.4)",
              }}>VIP</div>
            )}

            {/* Name + city ON image, above circle */}
            <div style={{
              position: "absolute", bottom: 40, left: 12, right: 12,
              pointerEvents: "none",
            }}>
              <p style={{
                color: "white", fontWeight: 700, fontSize: 13,
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                margin: 0, lineHeight: 1.3, textShadow: "0 1px 4px rgba(0,0,0,0.6)",
              }}>{title}</p>
              {locationDisplay && (
                <p style={{
                  color: "rgba(255,255,255,0.75)", fontSize: 11, marginTop: 2,
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  margin: "2px 0 0", textShadow: "0 1px 3px rgba(0,0,0,0.5)",
                }}>{locationDisplay}</p>
              )}
            </div>

            {/* Profile circle — centered, half outside bottom */}
            <div
              onClick={hasStory ? (e) => { e.preventDefault(); e.stopPropagation(); onStoryClick?.() } : undefined}
              style={{
                position: "absolute",
                bottom: -30,
                left: "50%",
                transform: "translateX(-50%)",
                width: 64, height: 64, borderRadius: "50%",
                padding: hasStory ? 3 : 2,
                background: hasStory
                  ? "linear-gradient(135deg, #DC2626, #F59E0B)"
                  : "white",
                boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                cursor: hasStory ? "pointer" : "default",
                zIndex: 10, flexShrink: 0,
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
                  width={64}
                  height={64}
                  style={{ objectFit: "cover", width: "100%", height: "100%" }}
                />
              </div>
            </div>
          </div>
        </Link>

        {/* ── Spacer for circle overhang ── */}
        <Link href={`/ads/${id}`} style={{ display: "block", textDecoration: "none" }}>
          <div style={{ height: 44, background: "white" }} />
        </Link>
      </div>
    </>
  )
}
