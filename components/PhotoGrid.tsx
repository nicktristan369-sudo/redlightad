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
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(0,0,0,0.25)")}
          onMouseLeave={e => (e.currentTarget.style.background = "rgba(0,0,0,0)")}
          >
            <svg width="20" height="20" fill="none" stroke="white" strokeWidth="2" style={{ opacity: 0.9 }} viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              <line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
            </svg>
          </div>
        </div>
      ))}
    </div>
  )
}
