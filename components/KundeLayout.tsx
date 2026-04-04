"use client"
import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase"
import Logo from "@/components/Logo"
import {
  LayoutDashboard, MessageSquare, Coins, Settings, Shield, LogOut, Heart, User,
} from "lucide-react"

const NAV = [
  { href: "/kunde",          label: "Oversigt",   icon: LayoutDashboard },
  { href: "/kunde/feed",     label: "Feed",        icon: Heart },
  { href: "/kunde/beskeder", label: "Beskeder",    icon: MessageSquare },
  { href: "/kunde/coins",    label: "RedCoins",    icon: Coins },
  { href: "/kunde/profil",   label: "Min profil",  icon: User },
  { href: "/kunde/verify",   label: "Verificer",   icon: Shield },
]

export default function KundeLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [displayName, setDisplayName] = useState("")
  const [avatar, setAvatar] = useState<string | null>(null)
  const [coins, setCoins] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push("/login"); return }
      // Ensure customer account
      if (user.user_metadata?.account_type !== "customer" && user.user_metadata?.account_type !== undefined) {
        router.push("/dashboard")
        return
      }
      supabase.from("customer_profiles").select("*").eq("user_id", user.id).single()
        .then(({ data }) => {
          if (data) {
            setDisplayName(data.username || user.email?.split("@")[0] || "Kunde")
            setAvatar(data.avatar_url)
            setCoins(data.redcoins || 0)
          } else {
            setDisplayName(user.email?.split("@")[0] || "Kunde")
          }
        })
    })
  }, [router])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  const Sidebar = () => (
    <div style={{ width: 240, flexShrink: 0, background: "#0A0A0A", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Logo */}
      <div style={{ padding: "20px 20px 12px" }}>
        <Logo variant="dark" height={22} />
        <div style={{ marginTop: 4, fontSize: 10, color: "#6B7280", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          KUNDE PORTAL
        </div>
      </div>

      {/* User info */}
      <div style={{ margin: "0 12px 16px", padding: "12px", background: "#1A1A1A", borderRadius: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#DC2626", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
            {avatar ? <img src={avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>{displayName[0]?.toUpperCase()}</span>}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{displayName}</div>
            <div style={{ fontSize: 11, color: "#6B7280" }}>Privat konto</div>
          </div>
        </div>
        {/* RedCoins */}
        <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", background: "#111", borderRadius: 8 }}>
          <span style={{ fontSize: 14 }}>🔴</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#DC2626" }}>{coins.toLocaleString()}</span>
          <span style={{ fontSize: 11, color: "#6B7280" }}>RedCoins</span>
          <Link href="/kunde/coins" style={{ marginLeft: "auto", fontSize: 10, fontWeight: 700, color: "#DC2626", textDecoration: "none" }}>+ Køb</Link>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "0 8px" }}>
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/kunde" && pathname.startsWith(href))
          return (
            <Link key={href} href={href} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
              borderRadius: 8, marginBottom: 2, textDecoration: "none",
              background: active ? "#DC2626" : "transparent",
              color: active ? "#fff" : "#9CA3AF",
              fontWeight: active ? 700 : 500, fontSize: 13,
              transition: "background 0.15s, color 0.15s",
            }}>
              <Icon size={16} style={{ flexShrink: 0 }} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div style={{ padding: "12px 8px 20px" }}>
        <button onClick={handleLogout} style={{
          display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
          width: "100%", background: "none", border: "none", cursor: "pointer",
          color: "#6B7280", fontSize: 13, fontWeight: 500, borderRadius: 8,
          transition: "color 0.15s",
        }}>
          <LogOut size={16} />
          Log ud
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#F5F5F7" }}>
      {/* Desktop sidebar */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3" style={{ background: "#0A0A0A", borderBottom: "1px solid #1A1A1A" }}>
        <Logo variant="dark" height={20} />
        <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: "none", border: "none", cursor: "pointer", color: "#fff" }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M3 12h18M3 6h18M3 18h18" /></svg>
        </button>
      </div>

      {/* Mobile drawer */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div onClick={() => setSidebarOpen(false)} style={{ flex: 1, background: "rgba(0,0,0,0.5)" }} />
          <div style={{ width: 260, height: "100vh", overflow: "auto" }}>
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main */}
      <main style={{ flex: 1, padding: "24px 24px 24px", paddingTop: 24 }} className="pt-16 md:pt-6">
        {children}
      </main>
    </div>
  )
}
