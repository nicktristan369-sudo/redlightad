"use client"
import { useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { CheckCircle, Mic, Play, MapPin } from "lucide-react"
import { useLanguage } from "@/lib/i18n/LanguageContext"

interface AdCardProps {
  id: string | number;
  title: string;
  image: string;
  verified: boolean;
  description: string;
  hasVoice: boolean;
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
}

export default function AdCard({
  id,
  title,
  image,
  verified,
  description,
  hasVoice,
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
}: AdCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const { t } = useLanguage()

  const locationDisplay = city && country
    ? `${city}, ${country}`
    : city || country || location || "";

  return (
    <Link href={`/ads/${id}`} className="block group">
      <div className={`flex flex-col sm:flex-row gap-4 sm:gap-5 rounded-2xl bg-white p-4 transition-all hover:shadow-md relative ${
        premium_tier === "vip" ? "ring-1 ring-yellow-300" : premium_tier === "featured" ? "ring-1 ring-blue-200" : "border border-gray-100"
      }`} style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>

        {/* Premium badge */}
        {premium_tier === "vip" && (
          <div className="absolute top-3 left-3 z-10 text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full"
            style={{ backgroundColor: "rgba(0,0,0,0.75)", color: "#D4AF37", border: "1px solid rgba(212,175,55,0.4)" }}>
            VIP
          </div>
        )}
        {premium_tier === "featured" && (
          <div className="absolute top-3 left-3 z-10 bg-blue-600 text-white text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full">
            Featured
          </div>
        )}

        {/* Image */}
        <div
          className="relative h-[200px] sm:h-[180px] w-full sm:w-[180px] flex-shrink-0 overflow-hidden rounded-xl"
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
            {hasVoice && (
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <Mic className="w-3.5 h-3.5" />
                <span>Voice message</span>
              </div>
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {locationDisplay && (
              <span className="flex items-center gap-1 rounded-lg bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-600 border border-gray-100">
                <MapPin className="w-3 h-3" />
                {locationDisplay}
              </span>
            )}
            {[`${age} ${t.ad_yrs}`, gender, category, language].filter(Boolean).map((tag) => (
              <span key={tag} className="rounded-lg bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-600 border border-gray-100">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Link>
  )
}
