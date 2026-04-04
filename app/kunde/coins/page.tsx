"use client"
import KundeLayout from "@/components/KundeLayout"
import Link from "next/link"

export default function KundeCoins() {
  return (
    <KundeLayout>
      <div style={{ maxWidth: 480 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: "#111", marginBottom: 4 }}>RedCoins</h1>
        <p style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 24 }}>Brug RedCoins til at låse eksklusivt indhold op</p>
        <Link href="/dashboard/buy-coins" style={{
          display: "block", background: "#000", color: "#fff", borderRadius: 12,
          padding: "18px 24px", textDecoration: "none", textAlign: "center",
          fontSize: 15, fontWeight: 700,
        }}>
          🔴 Køb RedCoins
        </Link>
      </div>
    </KundeLayout>
  )
}
