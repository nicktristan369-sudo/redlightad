"use client"
import { useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { CheckCircle, Mic, Play, MapPin } from "lucide-react"
import { useLanguage } from "@/lib/i18n/LanguageContext"
import VoiceMessagePlayer from "@/components/VoiceMessagePlayer"

interface AdCardProps {
  id: string | number;
  title: string;
  image: string;
  verified: boolean;
  description: string;
  hasVoice: boolean;
  voiceUrl?: string | null;
  hasVideo?: boolean;
  videoUrl?: string;
  age: number;
  gender: string;
  category: string;
  country?: string;
  city?: string;
  location?: string;
  language: string;
  premium_tier?: string | null;
  social_links?: Record<string, { url?: string }> | null;
}

export default function AdCard({
  id,
  title,
  image,
  verified,
  description,
  hasVoice,
  voiceUrl,
  hasVideo,
  videoUrl,
  age,
  gender,
  category,
  country,
  city,
  location,
  language,
  premium_tier,
  social_links,
}: AdCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const { t } = useLanguage()

  const locationDisplay = city && country
    ? `${city}, ${country}`
    : city || country || location || "";

  return (
    <Link href={`/ads/${id}`} className="block group">
      <div
        className="flex flex-col sm:flex-row gap-4 sm:gap-5 rounded-none p-4 transition-all hover:shadow-md relative"
        style={{
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
          background: premium_tier === "vip" || premium_tier === "featured" || premium_tier === "basic" ? "#FFFAFA" : "#fff",
          border: premium_tier === "vip" || premium_tier === "featured" || premium_tier === "basic"
            ? "1px solid rgba(220,38,38,0.15)"
            : "1px solid #F3F4F6",
          borderLeft: premium_tier === "vip" || premium_tier === "featured" || premium_tier === "basic"
            ? "3px solid #DC2626"
            : "1px solid #F3F4F6",
        }}
      >

        {/* Premium badge */}
        {(premium_tier === "vip" || premium_tier === "featured" || premium_tier === "basic") && (
          <div className="absolute top-3 left-3 z-10 text-[10px] font-bold tracking-widest uppercase px-2 py-0.5"
            style={{ background: "#111", color: "#fff", fontSize: 10, fontWeight: 600, letterSpacing: "0.8px", padding: "3px 8px", textTransform: "uppercase" as const }}>
            PREMIUM
          </div>
        )}

        {/* Image */}
        <div
          className="relative h-[200px] sm:h-[180px] w-full sm:w-[180px] flex-shrink-0 overflow-hidden rounded-none"
          onMouseEnter={() => {
            if (hasVideo && videoRef.current) {
              videoRef.current.style.display = "block"
              videoRef.current.play()
            }
          }}
          onMouseLeave={() => {
            if (hasVideo && videoRef.current) {
              videoRef.current.pause()
              videoRef.current.style.display = "none"
            }
          }}
        >
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            unoptimized
          />
          {hasVideo && videoUrl && (
            <video ref={videoRef} src={videoUrl} muted loop playsInline className="absolute inset-0 w-full h-full object-cover" style={{ display: "none" }} />
          )}
          {hasVideo && (
            <div className="absolute top-2 right-2 bg-black/60 text-white rounded-full w-7 h-7 flex items-center justify-center backdrop-blur-sm">
              <Play className="w-3 h-3 fill-white" />
            </div>
          )}
          {/* OnlyFans badge */}
          {social_links?.onlyfans?.url && (
            <div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-full px-2 py-1"
              style={{ background: "rgba(0,175,240,0.92)", backdropFilter: "blur(4px)" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="white">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 4c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm4 10.5H8v-1.5c0-2.67 5.33-4 8-4 0 0-1.33 1.33-1.33 2.67V16.5z"/>
              </svg>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#fff", letterSpacing: "0.03em" }}>OF</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex min-w-0 flex-1 flex-col justify-between py-1">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <h3 className="truncate text-base font-bold text-gray-900 tracking-tight">{title}</h3>
              {verified && (
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
              )}
            </div>
            <p className="mb-3 line-clamp-2 text-sm text-gray-500 leading-relaxed">{description}</p>
            {hasVoice && voiceUrl ? (
              <VoiceMessagePlayer url={voiceUrl} compact />
            ) : hasVoice ? (
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <Mic className="w-3.5 h-3.5" />
                <span>Voice message</span>
              </div>
            ) : null}
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {locationDisplay && (
              <span className="flex items-center gap-1 rounded bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-600 border border-gray-100">
                <MapPin className="w-3 h-3" />
                {locationDisplay}
              </span>
            )}
            {[`${age} ${t.ad_yrs}`, gender, category, language].filter(Boolean).map((tag) => (
              <span key={tag} className="rounded bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-600 border border-gray-100">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Link>
  )
}
