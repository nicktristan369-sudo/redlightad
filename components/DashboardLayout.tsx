"use client"
import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase"
import Logo from "@/components/Logo"
import {
  LayoutDashboard,
  FileText,
  Plus,
  MessageSquare,
  Lock,
  Wallet,
  Coins,
  Settings,
  Shield,
  LogOut,
} from "lucide-react"

const NAV_ITEMS = [
  { href: "/dashboard",               label: "Oversigt",           icon: LayoutDashboard },
  { href: "/dashboard/annoncer",      label: "Mine annoncer",      icon: FileText },
  { href: "/opret-annonce",           label: "Opret annonce",      icon: Plus },
  { href: "/dashboard/beskeder",      label: "Beskeder",           icon: MessageSquare },
  { href: "/dashboard/locked-content",label: "Eksklusivt indhold", icon: Lock },
  { href: "/dashboard/wallet",        label: "Wallet",             icon: Wallet },
  { href: "/dashboard/buy-coins",     label: "Køb coins",          icon: Coins },
  { href: "/dashboard/profil",        label: "Profil indstillinger",icon: Settings },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [email, setEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [totalUnread, setTotalUnread] = useState(0)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.replace("/login")
        setLoading(false)
        return
      }
      setEmail(user.email ?? null)

      const { data: adminStatus } = await supabase.rpc("get_my_admin_status")
      setIsAdmin(!!adminStatus)

      supabase
        .from("conversations")
        .select("provider_unread, customer_unread, provider_id")
        .or(`provider_id.eq.${user.id},customer_id.eq.${user.id}`)
        .then(({ data }) => {
          const total = (data || []).reduce((sum, c) => {
            return sum + (c.provider_id === user.id ? c.provider_unread : c.customer_unread)
          }, 0)
          setTotalUnread(total)
        })

      setLoading(false)
    })
  }, [router])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#F8F8F8" }}>
        <div className="w-7 h-7 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const allNavItems = [
    ...NAV_ITEMS,
    ...(isAdmin ? [{ href: "/admin", label: "Admin panel", icon: Shield }] : []),
  ]
  const bottomNavItems = NAV_ITEMS.slice(0, 5)

  return (
    <div className="min-h-screen flex" style={{ background: "#F8F8F8" }}>

      {/* ── Sidebar ── */}
      <aside className="hidden md:flex w-60 flex-col fixed h-full z-10 bg-white"
        style={{ borderRight: "1px solid #E5E5E5" }}>

        {/* Logo + email */}
        <div className="px-5 py-5" style={{ borderBottom: "1px solid #F3F4F6" }}>
          <Link href="/">
            <Logo variant="light" height={22} />
          </Link>
          {email && (
            <p className="text-[11px] text-gray-400 mt-2 truncate">{email}</p>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {allNavItems.map((item) => {
            const isActive = item.href === "/dashboard"
              ? pathname === item.href
              : item.href === "/admin"
              ? pathname.startsWith("/admin")
              : pathname.startsWith(item.href) && item.href !== "/opret-annonce"
                ? pathname.startsWith(item.href)
                : pathname === item.href
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors group relative"
                style={{
                  background: isActive ? "#000" : "transparent",
                  color: isActive ? "#fff" : "#374151",
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "#F5F5F5" }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent" }}
              >
                <Icon
                  size={15}
                  style={{ color: isActive ? "#fff" : "#6B7280", flexShrink: 0 }}
                />
                <span className="flex-1 truncate">{item.label}</span>
                {item.href === "/dashboard/beskeder" && totalUnread > 0 && (
                  <span className="text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: isActive ? "#fff" : "#000", color: isActive ? "#000" : "#fff" }}>
                    {totalUnread > 9 ? "9+" : totalUnread}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Sign out */}
        <div className="px-3 pb-4" style={{ borderTop: "1px solid #F3F4F6", paddingTop: "12px" }}>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium w-full transition-colors"
            style={{ color: "#6B7280" }}
            onMouseEnter={e => { e.currentTarget.style.background = "#F5F5F5"; e.currentTarget.style.color = "#111" }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#6B7280" }}
          >
            <LogOut size={15} style={{ flexShrink: 0 }} />
            Log ud
          </button>
        </div>
      </aside>

      {/* ── Mobile bottom nav ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-20 flex md:hidden items-center justify-around bg-white py-2 px-1"
        style={{ borderTop: "1px solid #E5E5E5" }}>
        {bottomNavItems.map((item) => {
          const isActive = item.href === "/dashboard" ? pathname === item.href : pathname.startsWith(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors relative"
            >
              <Icon size={20} style={{ color: isActive ? "#000" : "#9CA3AF" }} />
              <span className="text-[10px] font-medium truncate max-w-[56px]"
                style={{ color: isActive ? "#000" : "#9CA3AF" }}>
                {item.label.split(" ")[0]}
              </span>
              {item.href === "/dashboard/beskeder" && totalUnread > 0 && (
                <span className="absolute -top-0.5 right-1 text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center"
                  style={{ background: "#000", color: "#fff" }}>
                  {totalUnread > 9 ? "9+" : totalUnread}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* ── Main content ── */}
      <main className="flex-1 ml-0 md:ml-60 p-4 md:p-8 pb-24 md:pb-8">
        {children}
      </main>
    </div>
  )
}
