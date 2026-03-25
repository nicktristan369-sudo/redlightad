"use client"
import Image from "next/image"

export default function PhotoGrid({ images, onImageClick }: { images: string[]; onImageClick: (index: number) => void }) {
  if (!images || images.length === 0) return null
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2 }}>
      {images.map((src, i) => (
        <div
          key={i}
          onClick={() => onImageClick(i)}
          style={{ position: "relative", aspectRatio: "1/1", overflow: "hidden", cursor: "pointer" }}
        >
          <Image src={src} alt={`Photo ${i + 1}`} fill style={{ objectFit: "cover" }} sizes="(max-width: 768px) 33vw, 200px" />
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
