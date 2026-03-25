"use client"

interface Props {
  lockedImages: string[]
  lockedVideos: { id: string; thumbnail_url: string | null; redcoin_price: number }[]
  isLoggedIn: boolean
  listingId: string
}

export default function PrivateContentPreview({ lockedImages, lockedVideos, isLoggedIn }: Props) {
  const allThumbs: string[] = [
    ...lockedImages,
    ...lockedVideos.filter(v => v.thumbnail_url).map(v => v.thumbnail_url as string),
  ].slice(0, 4)

  const hasItems = lockedImages.length > 0 || lockedVideos.length > 0
  const cols = allThumbs.length >= 4 ? 4 : 2

  const lowestPrice = lockedVideos.length > 0
    ? Math.min(...lockedVideos.map(v => v.redcoin_price))
    : 5

  return (
    <div style={{ background: "#111", borderRadius: 0, overflow: "hidden" }}>
      {/* Blur grid with overlay */}
      {hasItems && allThumbs.length > 0 && (
        <div style={{ position: "relative" }}>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 0 }}>
            {allThumbs.map((src, i) => (
              <div key={i} style={{ position: "relative", overflow: "hidden", aspectRatio: "1/1" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt=""
                  style={{
                    filter: "blur(14px)",
                    transform: "scale(1.15)",
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    opacity: 0.5,
                  }}
                />
              </div>
            ))}
          </div>

          {/* Overlay */}
          <div style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            background: "rgba(0,0,0,0.45)",
            zIndex: 2,
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" style={{ opacity: 0.8 }}>
              <rect x="3" y="11" width="18" height="11" rx="0" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", fontWeight: 500 }}>
              {lockedImages.length} photos{lockedVideos.length > 0 ? ` • ${lockedVideos.length} videos` : ""} available
            </span>
          </div>
        </div>
      )}

      {/* Info section */}
      <div style={{ padding: "20px 20px 24px", background: "#111", textAlign: "center" }}>
        <p style={{ fontSize: 16, fontWeight: 600, color: "white", margin: "0 0 6px" }}>Private Content</p>

        {!isLoggedIn ? (
          <>
            <p style={{ fontSize: 13, color: "#888", marginBottom: 20 }}>Create a free account to unlock</p>
            <div style={{ display: "flex", justifyContent: "center", gap: 10 }}>
              <a
                href="/register"
                style={{
                  background: "white",
                  color: "#111",
                  padding: "10px 20px",
                  fontSize: 13,
                  fontWeight: 600,
                  border: "none",
                  cursor: "pointer",
                  borderRadius: 0,
                  textDecoration: "none",
                }}
              >
                Sign Up Free
              </a>
              <a
                href="/login"
                style={{
                  background: "transparent",
                  color: "#aaa",
                  padding: "10px 20px",
                  fontSize: 13,
                  border: "1px solid #333",
                  cursor: "pointer",
                  borderRadius: 0,
                  textDecoration: "none",
                }}
              >
                Login
              </a>
            </div>
          </>
        ) : (
          <>
            <p style={{ fontSize: 13, color: "#888", marginBottom: 12 }}>Use RedCoins to unlock this private content</p>
            <p style={{ fontSize: 18, fontWeight: 700, color: "white", marginBottom: 16 }}>
              {lowestPrice} RedCoins
            </p>
            <a
              href="/dashboard/coins"
              style={{
                display: "block",
                background: "#DC2626",
                color: "white",
                padding: "12px 28px",
                fontSize: 14,
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
                width: "100%",
                textDecoration: "none",
                boxSizing: "border-box",
                textAlign: "center",
              }}
            >
              Unlock with RedCoins
            </a>
          </>
        )}
      </div>
    </div>
  )
}
