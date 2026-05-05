// Shared autoplay video component — bruger IntersectionObserver til at starte video
// når den er synlig i viewport, og pause når den forlader viewport
"use client"
import { useEffect, useRef, useState } from "react"

export function AutoPlayVideo({
  src,
  className,
  style,
  onError,
}: {
  src: string
  className?: string
  style?: React.CSSProperties
  onError?: () => void
}) {
  const ref = useRef<HTMLVideoElement>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const video = ref.current
    if (!video) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            video.play().catch(() => {
              // Autoplay blocked — try again on first interaction
              const tryPlay = () => {
                video.play().catch(() => {})
                document.removeEventListener("touchstart", tryPlay)
                document.removeEventListener("click", tryPlay)
              }
              document.addEventListener("touchstart", tryPlay, { once: true })
              document.addEventListener("click", tryPlay, { once: true })
            })
          } else {
            video.pause()
          }
        })
      },
      { threshold: 0.1 }
    )

    observer.observe(video)
    return () => observer.disconnect()
  }, [src])

  if (failed) return null

  return (
    <video
      ref={ref}
      key={src}
      src={src}
      muted
      loop
      playsInline
      preload="metadata"
      className={className}
      style={style}
      onError={() => { setFailed(true); onError?.() }}
    />
  )
}
