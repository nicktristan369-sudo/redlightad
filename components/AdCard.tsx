"use client"
import { useRef } from "react"
import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface AdCardProps {
  id: number;
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

  const tags = [
    `${age} ${t.ad_yrs}`,
    gender,
    category,
    locationDisplay,
    language,
  ].filter(Boolean);

  return (
    <Link href={`/ads/${id}`} className="block">
    <div className={`flex gap-4 rounded-xl bg-white p-4 shadow-md transition-shadow hover:shadow-lg relative ${
      premium_tier === "vip" ? "ring-2 ring-yellow-400" : premium_tier === "featured" ? "ring-2 ring-blue-400" : ""
    }`}>
      {/* Premium badge */}
      {premium_tier === "vip" && (
        <div className="absolute top-2 left-2 z-10 bg-yellow-400 text-gray-900 text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
          {"\uD83D\uDC51"} VIP
        </div>
      )}
      {premium_tier === "featured" && (
        <div className="absolute top-2 left-2 z-10 bg-blue-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
          {"\u2B50"} Featured
        </div>
      )}

      <div
        className="relative h-[200px] w-[200px] flex-shrink-0 overflow-hidden rounded-lg"
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
          className="object-cover"
          unoptimized
        />
        {hasVideo && videoUrl && (
          <video
            ref={videoRef}
            src={videoUrl}
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
            style={{ display: "none" }}
          />
        )}
        {hasVideo && (
          <div className="absolute top-2 right-2 bg-black/60 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs">
            {"\u25B6"}
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <h3 className="truncate text-lg font-bold text-gray-900">{title}</h3>
            {verified && (
              <span className="whitespace-nowrap text-sm font-medium text-green-600">
                {t.ad_verified}
              </span>
            )}
          </div>
          <p className="mb-2 line-clamp-2 text-sm text-gray-600">{description}</p>
          {hasVoice && (
            <p className="text-xs text-gray-500">{t.ad_voice}</p>
          )}
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
    </Link>
  );
}
