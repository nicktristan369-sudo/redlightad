"use client"
import { useRef, useState } from "react"
import { AutoPlayVideo } from "@/components/AutoPlayVideo"
import Image from "next/image"
import Link from "next/link"
import { CheckCircle, Mic, MapPin } from "lucide-react"
import { useLanguage } from "@/lib/i18n/LanguageContext"
import VoiceMessagePlayer from "@/components/VoiceMessagePlayer"

interface AdCardProps {
  id: string | number;
  slug?: string | null;
  title: string;
  image: string;
  verified: boolean;
  description: string;
  hasVoice: boolean;
  voiceUrl?: string | null;
  hasVideo?: boolean;
  videoUrl?: string;
  profileVideoUrl?: string | null;
  age: number;
  gender: string;
  category: string;
  country?: string;
  city?: string;
  location?: string;
  language: string;
  premium_tier?: string | null;
  social_links?: Record<string, { url?: string }> | null;
  onlyfans_username?: string | null;
}

export default function AdCard({
  id,
  slug,
  title,
  image,
  verified,
  description,
  hasVoice,
  voiceUrl,
  hasVideo,
  videoUrl,
  profileVideoUrl,
  age,
  gender,
  category,
  country,
  city,
  location,
  language,
  premium_tier,
  social_links,
  onlyfans_username,
}: AdCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [videoFailed, setVideoFailed] = useState(false)
  const { t } = useLanguage()

  const locationDisplay = city && country
    ? `${city}, ${country}`
    : city || country || location || "";

  return (
    <Link href={`/ads/${slug || id}`} className="block group">
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
        <div className="relative h-[200px] sm:h-[180px] w-full sm:w-[180px] flex-shrink-0 overflow-hidden rounded-none">
          {/* Autoplay profile video if available */}
          {profileVideoUrl && !videoFailed ? (
            <AutoPlayVideo
              src={profileVideoUrl}
              className="absolute inset-0 w-full h-full object-cover"
              onError={() => setVideoFailed(true)}
            />
          ) : (
            <Image
              src={image}
              alt={title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              unoptimized
            />
          )}
          {/* Hover-to-play for regular video (non-profile) */}
          {!profileVideoUrl && hasVideo && videoUrl && (
            <video
              ref={videoRef}
              src={videoUrl}
              muted loop playsInline
              className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity"
              onMouseEnter={() => videoRef.current?.play()}
            />
          )}
          {/* OnlyFans badge */}
          {(social_links?.onlyfans?.url || onlyfans_username) && (
            <div className="absolute bottom-2 right-2 flex items-center rounded-full px-2 py-1"
              style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}>
              <img src="/onlyfans-logo.svg" alt="OnlyFans" style={{ width: 52, height: 16, objectFit: "contain" }} />
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
