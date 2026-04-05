"use client"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase"
import KundeLayout from "@/components/KundeLayout"
import Link from "next/link"
import { MessageSquare, Coins, Shield, Heart, User, CheckCircle, Search } from "lucide-react"

export default function KundeDashboard() {
  const [stats, setStats] = useState({ messages: 0, following: 0, coins: 0, verified: false })
  const [username, setUsername] = useState("")

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      setUsername(user.email?.split("@")[0] || "Kunde")
      supabase.from("customer_profiles").select("*").eq("user_id", user.id).single()
        .then(({ data }) => {
          if (data) {
            setUsername(data.username || user.email?.split("@")[0] || "Kunde")
            setStats(prev => ({ ...prev, coins: data.redcoins || 0, verified: !!data.phone_verified }))
          }
        })
    })
  }, [])

  const tiles = [
    { href: "/kunde/beskeder", icon: MessageSquare, label: "Beskeder", value: stats.messages, color: "#3B82F6", desc: "Private samtaler" },
    { href: "/kunde/feed",     icon: Heart,         label: "Feed",     value: stats.following, color: "#e91e8c", desc: "Profiler du følger" },
    { href: "/kunde/coins",    icon: Coins,         label: "RedCoins", value: stats.coins,    color: "#DC2626", desc: "Din balance" },
    { href: "/kunde/verify",   icon: Shield,        label: "Verificeret", value: stats.verified ? "✓" : "–", color: "#16A34A", desc: stats.verified ? "Din konto er verificeret" : "Bekræft din identitet" },
  ]

  return (
    <KundeLayout>
      <div style={{ maxWidth: 760 }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#111", margin: 0 }}>Hej, {username}</h1>
          <p style={{ fontSize: 14, color: "#6B7280", marginTop: 4 }}>Din private konto — kun synlig for profiler du kontakter</p>
        </div>

        {/* Privacy notice */}
        <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 12, padding: "12px 16px", marginBottom: 24, display: "flex", alignItems: "flex-start", gap: 10 }}>
          <CheckCircle size={16} color="#16A34A" style={{ flexShrink: 0, marginTop: 2 }} />
          <p style={{ fontSize: 13, color: "#166534", margin: 0, lineHeight: 1.5 }}>
            <strong>Din profil er privat.</strong> Andre brugere kan ikke se dig eller søge dig frem. Kun profiler du sender en besked til kan se din profil.
          </p>
        </div>

        {/* Stats tiles */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12, marginBottom: 28 }}>
          {tiles.map(({ href, icon: Icon, label, value, color, desc }) => (
            <Link key={href} href={href} style={{ textDecoration: "none" }}>
              <div style={{ background: "#fff", borderRadius: 12, padding: "18px 16px", border: "1px solid #E5E7EB", transition: "box-shadow 0.15s" }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)")}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: color + "18", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                  <Icon size={18} color={color} />
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#111", lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginTop: 4 }}>{label}</div>
                <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>{desc}</div>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick actions */}
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #E5E7EB", overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid #F3F4F6" }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "#111", margin: 0 }}>Hvad vil du gøre?</h2>
          </div>
          {[
            { href: "/", label: "Gennemse profiler", icon: Search, desc: "Find og kontakt eskorteprofiler" },
            { href: "/kunde/profil", label: "Opdater din profil", icon: User, desc: "Tilføj billede, bio og alder" },
            { href: "/kunde/coins", label: "Køb RedCoins", icon: Coins, desc: "Betaling for låst indhold" },
            { href: "/kunde/verify", label: "Verificer dig selv", icon: Shield, desc: "Byg tillid hos profilerne" },
          ].map(({ href, label, icon: Icon, desc }) => (
            <Link key={href} href={href} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", textDecoration: "none", borderBottom: "1px solid #F9FAFB" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#FAFAFA")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon size={16} color="#6B7280" />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#111" }}>{label}</div>
                <div style={{ fontSize: 12, color: "#9CA3AF" }}>{desc}</div>
              </div>
              <svg style={{ marginLeft: "auto", flexShrink: 0 }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth={2}><path d="M9 18l6-6-6-6"/></svg>
            </Link>
          ))}
        </div>
      </div>
    </KundeLayout>
  )
}
