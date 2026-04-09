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
      setUsername(user.email?.split("@")[0] || "Customer")
      supabase.from("customer_profiles").select("*").eq("user_id", user.id).single()
        .then(({ data }) => {
          if (data) {
            setUsername(data.username || user.email?.split("@")[0] || "Customer")
            setStats(prev => ({ ...prev, coins: data.redcoins || 0, verified: !!data.phone_verified }))
          }
        })
    })
  }, [])

  const tiles = [
    { href: "/kunde/beskeder", icon: MessageSquare, label: "Messages", value: stats.messages, color: "#3B82F6", desc: "Private conversations" },
    { href: "/kunde/feed",     icon: Heart,         label: "Feed",     value: stats.following, color: "#e91e8c", desc: "Profiles you follow" },
    { href: "/kunde/coins",    icon: Coins,         label: "RedCoins", value: stats.coins,    color: "#DC2626", desc: "Your balance" },
    { href: "/kunde/verify",   icon: Shield,        label: "Verified", value: stats.verified ? "✓" : "–", color: stats.verified ? "#16A34A" : "#9CA3AF", desc: stats.verified ? "ID verified" : "Not verified yet" },
  ]

  return (
    <KundeLayout>
      <div style={{ maxWidth: 760 }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#111", margin: 0 }}>Hey, {username}</h1>
          <p style={{ fontSize: 14, color: "#6B7280", marginTop: 4 }}>Your private account — only visible to profiles you contact</p>
        </div>

        {/* Privacy notice */}
        <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 12, padding: "12px 16px", marginBottom: 24, display: "flex", alignItems: "flex-start", gap: 10 }}>
          <CheckCircle size={16} color="#16A34A" style={{ flexShrink: 0, marginTop: 2 }} />
          <p style={{ fontSize: 13, color: "#166534", margin: 0, lineHeight: 1.5 }}>
            <strong>Your profile is private.</strong> Other users cannot see or search for you. Only profiles you message can see your profile.
          </p>
        </div>

        {/* Verification banner */}
        {stats.verified ? (
          <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 12, padding: "14px 18px", marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#16A34A", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#166534", margin: 0 }}>ID Verified</p>
              <p style={{ fontSize: 12, color: "#22C55E", margin: "2px 0 0" }}>Your verification badge is visible to all profiles you contact</p>
            </div>
          </div>
        ) : (
          <Link href="/kunde/verify" style={{ textDecoration: "none", display: "block", marginBottom: 20 }}>
            <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", gap: 12 }}
              onMouseEnter={e => (e.currentTarget.style.background = "#FEF3C7")}
              onMouseLeave={e => (e.currentTarget.style.background = "#FFFBEB")}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#F59E0B", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Shield size={18} color="#fff" />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#92400E", margin: 0 }}>Verify your identity</p>
                <p style={{ fontSize: 12, color: "#B45309", margin: "2px 0 0" }}>Build trust with profiles — verified users get more responses</p>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#B45309" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
            </div>
          </Link>
        )}

        {/* Stats tiles */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12, marginBottom: 28 }}>
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
                <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>{desc}</div>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick actions */}
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #E5E7EB", overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid #F3F4F6" }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "#111", margin: 0 }}>What would you like to do?</h2>
          </div>
          {[
            { href: "/", label: "Browse profiles", icon: Search, desc: "Find and contact escort profiles" },
            { href: "/kunde/profil", label: "Update your profile", icon: User, desc: "Add photo, bio and age" },
            { href: "/kunde/coins", label: "Buy RedCoins", icon: Coins, desc: "Payment for locked content" },
            ...(!stats.verified ? [{ href: "/kunde/verify", label: "Verify your identity", icon: Shield, desc: "Build trust — verified users get more responses" }] : []),
          ].map(({ href, label, icon: Icon, desc }) => (
            <Link key={href} href={href} style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 18px", textDecoration: "none", borderBottom: "1px solid #F9FAFB" }}
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
