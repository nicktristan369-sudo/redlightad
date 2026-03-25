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
}

export default function AdCardGrid({ id, title, image, verified, age, city, country, location, opening_hours, timezone, premium_tier }: AdCardGridProps) {
  const locationDisplay = city && country ? `${city}, ${country}` : city || country || location || ""
  const available = isAvailableNow(opening_hours, timezone)
  return (
    <Link href={`/ads/${id}`} className="block group">
      <div className="relative w-full overflow-hidden rounded-none bg-gray-200" style={{ aspectRatio: "3/4" }}>
        <Image src={image} alt={title} fill className="object-cover transition-transform duration-300 group-hover:scale-105" sizes="(max-width:640px) 50vw,(max-width:1024px) 33vw,25vw" />
        {/* gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        {/* Available dot */}
        {available && <div className="absolute top-2 left-2 w-2.5 h-2.5 bg-green-400 rounded-full ring-1 ring-white" />}
        {/* Verified */}
        {verified && <div className="absolute top-2 right-2"><CheckCircle size={16} className="text-white drop-shadow" /></div>}
        {/* premium badge */}
        {premium_tier === "vip" && (
          <div className="absolute top-2 left-2 text-[9px] font-bold tracking-widest uppercase px-2 py-0.5" style={{ backgroundColor: "rgba(0,0,0,0.75)", color: "#D4AF37", border: "1px solid rgba(212,175,55,0.4)" }}>VIP</div>
        )}
        {/* name + location */}
        <div className="absolute bottom-0 left-0 right-0 p-2.5">
          <p className="text-white font-semibold text-sm leading-tight truncate">{title}</p>
          {locationDisplay && <p className="text-gray-300 text-xs truncate mt-0.5">{locationDisplay}</p>}
        </div>
      </div>
    </Link>
  )
}
