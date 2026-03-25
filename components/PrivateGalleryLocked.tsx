"use client"
import Link from "next/link"
import { LockKeyhole } from "lucide-react"

export default function PrivateGalleryLocked({ isLoggedIn, count }: { isLoggedIn: boolean; count: number }) {
  return (
    <div style={{ background: "#111", color: "white", padding: "40px 24px", textAlign: "center" }}>
      <LockKeyhole size={32} color="#666" />
      <div style={{ fontSize: 16, fontWeight: 600, margin: "12px 0 8px" }}>Private Gallery</div>
      <div style={{ fontSize: 13, color: "#999" }}>{count} locked photos</div>

      {!isLoggedIn ? (
        <>
          <div style={{ fontSize: 13, color: "#888", marginTop: 12, marginBottom: 20 }}>
            Create a free account to unlock this gallery
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
            <Link href="/register" style={{
              background: "white", color: "#111", padding: "10px 20px",
              fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer",
              textDecoration: "none",
            }}>
              Sign Up Free
            </Link>
            <Link href="/login" style={{
              background: "transparent", color: "#aaa", padding: "10px 20px",
              fontSize: 13, fontWeight: 500, border: "1px solid #333", cursor: "pointer",
              textDecoration: "none",
            }}>
              Login
            </Link>
          </div>
        </>
      ) : (
        <>
          <div style={{ fontSize: 13, color: "#888", marginTop: 12, marginBottom: 20 }}>
            Unlock this gallery with RedCoins
          </div>
          <button style={{
            background: "white", color: "#111", padding: "10px 20px",
            fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer",
          }}>
            Unlock Gallery
          </button>
        </>
      )}
    </div>
  )
}
