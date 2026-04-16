"use client"
import Image from "next/image"
import { highQualityUrl } from "@/lib/cloudinaryUrl"

export default function PhotoGrid({ images, onImageClick }: { images: string[]; onImageClick: (index: number) => void }) {
  if (!images || images.length === 0) return null
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3" style={{ gap: 2 }}>
      {images.map((src, i) => (
        <div
          key={i}
          onClick={() => onImageClick(i)}
          style={{ position: "relative", aspectRatio: "1/1", overflow: "hidden", cursor: "pointer" }}
        >
          <Image src={highQualityUrl(src, 600)} alt={`Photo ${i + 1}`} fill style={{ objectFit: "cover" }} quality={95} sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 400px" unoptimized />
          {/* Hover overlay */}
          <div style={{
            position: "absolute", inset: 0,
            background: "rgba(0,0,0,0)",
            transition: "background 0.15s ease",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(0,0,0,0.2)")}
          onMouseLeave={e => (e.currentTarget.style.background = "rgba(0,0,0,0)")}
          />
        </div>
      ))}
    </div>
  )
}
