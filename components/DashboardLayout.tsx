"use client"
import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase"
import Logo from "@/components/Logo"
import dynamic from "next/dynamic"
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
  ShoppingBag,
  Tag,
  Zap,
  Eye,
  Star,
  ExternalLink,
  Radio,
  Film,
  Share2,
  Receipt,
  BarChart3,
} from "lucide-react"

const NotificationBell = dynamic(() => import("@/components/NotificationBell"), { ssr: false })
const UpgradeToPremiumModal = dynamic(() => import("@/components/UpgradeToPremiumModal"), { ssr: false })

interface NavItem {
  href: string
  label: string
  icon: any
  premiumOnly?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard",                label: "Overview",            icon: LayoutDashboard },
  { href: "/dashboard/beskeder",       label: "Messages",            icon: MessageSquare },
  { href: "/dashboard/locked-content", label: "Exclusive Content",   icon: Lock, premiumOnly: true },
  { href: "/dashboard/marketplace",    label: "Marketplace",         icon: Tag, premiumOnly: true },
  { href: "/dashboard/mine-kob",       label: "My Purchases",        icon: ShoppingBag },
  { href: "/dashboard/wallet",         label: "Wallet",              icon: Wallet },
  { href: "/dashboard/buy-coins",      label: "Buy Coins",           icon: Coins },
  { href: "/dashboard/boost",          label: "Premium & Boost",     icon: Zap },
  { href: "/dashboard/analytics",      label: "Analytics",           icon: BarChart3 },
  { href: "/dashboard/invoices",       label: "Invoices",            icon: Receipt },
  { href: "/dashboard/profil",         label: "Profile Settings",    icon: Settings },
  { href: "/dashboard/go-live",        label: "Go Live",             icon: Radio, premiumOnly: true },
  { href: "/dashboard/recordings",     label: "Recordings",          icon: Film, premiumOnly: true },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [email, setEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [totalUnread, setTotalUnread] = useState(0)
  const [isAdmin, setIsAdmin] = useState(false)
  const [listingId, setListingId] = useState<string | null>(null)
  const [listingChecked, setListingChecked] = useState(false)
  const [isPremium, setIsPremium] = useState(false)
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [pushPoints, setPushPoints] = useState<number>(0)
  const [quickPushing, setQuickPushing] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [upgradeFeature, setUpgradeFeature] = useState<string | undefined>()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.replace("/login")
        setLoading(false)
        return
      }
      // Kunder hører ikke til i provider-dashboard — send dem til /kunde
      if (user.user_metadata?.account_type === "customer") {
        router.replace("/kunde")
        return
      }
      setEmail(user.email ?? null)

      // Tjek om brugeren har en eksisterende listing
      const { data: listing } = await supabase
        .from("listings")
        .select("id, premium_tier")
        .eq("user_id", user.id)
        .in("status", ["active", "pending"])
        .limit(1)
        .single()
      setListingId(listing?.id ?? null)
      setIsPremium(!!listing?.premium_tier && ["basic", "featured", "vip"].includes(listing.premium_tier))
      setListingChecked(true)

      const { data: walletData } = await supabase
        .from("wallets")
        .select("push_points")
        .eq("user_id", user.id)
        .single()
      setPushPoints(walletData?.push_points ?? 0)

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

  const handleQuickPush = async () => {
    if (!listingId || pushPoints < 1) {
      router.push("/dashboard")
      return
    }
    setQuickPushing(true)
    const supabase = createClient()
    const token = (await supabase.auth.getSession()).data.session?.access_token
    const res = await fetch("/api/push-points/push", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ listingId }),
    })
    const data = await res.json()
    setQuickPushing(false)
    if (res.ok) setPushPoints(data.points_remaining)
  }

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

  const dynamicItems = listingChecked
    ? listingId
      ? [
          { href: `/dashboard/edit-profile`, label: "Edit my profile", icon: FileText },
          { href: `/ads/${listingId}`, label: "Preview", icon: Eye, target: "_blank" as const },
        ]
      : [
          { href: "/create-profile", label: "Create Profile", icon: Plus },
        ]
    : []

  const allNavItems = [
    NAV_ITEMS[0], // Oversigt
    ...dynamicItems,
    ...NAV_ITEMS.slice(1),
    { href: "/dashboard/social-links", label: "Social Links", icon: Share2 },
    { href: "/dashboard/onlyfans", label: "OnlyFans", icon: ExternalLink },
    ...(isAdmin ? [{ href: "/admin", label: "Admin panel", icon: Shield }] : []),
  ]
  const bottomNavItems = NAV_ITEMS.slice(0, 4)

  return (
    <div className="min-h-screen flex" style={{ background: "#F8F8F8" }}>

      {/* ── Sidebar ── */}
      <aside className="hidden md:flex w-60 flex-col fixed h-full z-10 bg-white"
        style={{ borderRight: "1px solid #E5E5E5" }}>

        {/* Logo + email + notifications */}
        <div className="px-5 py-5" style={{ borderBottom: "1px solid #F3F4F6" }}>
          <div className="flex items-center justify-between">
            <Link href="/">
              <Logo variant="light" height={22} />
            </Link>
            <NotificationBell />
          </div>
          {email && (
            <p className="text-[11px] text-gray-400 mt-2 truncate">{email}</p>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {allNavItems.map((item) => {
            const navItem = item as NavItem
            const isActive = item.href === "/dashboard"
              ? pathname === item.href
              : item.href === "/admin"
              ? pathname.startsWith("/admin")
              : pathname.startsWith(item.href) && item.href !== "/create-profile"
                ? pathname.startsWith(item.href)
                : pathname === item.href
            const Icon = item.icon
            const target = "target" in item ? (item as { target?: string }).target : undefined
            const isPremiumLocked = navItem.premiumOnly && !isPremium

            const handleClick = (e: React.MouseEvent) => {
              if (isPremiumLocked) {
                e.preventDefault()
                setUpgradeFeature(navItem.label)
                setShowUpgradeModal(true)
              }
            }

            return (
              <Link
                key={item.href}
                href={isPremiumLocked ? "#" : item.href}
                onClick={handleClick}
                {...(target ? { target, rel: "noopener noreferrer" } : {})}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors group relative"
                style={{
                  background: isActive ? "#000" : "transparent",
                  color: isActive ? "#fff" : "#374151",
                  opacity: isPremiumLocked ? 0.7 : 1,
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "#F5F5F5" }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent" }}
              >
                <Icon
                  size={15}
                  style={{ color: isActive ? "#fff" : "#6B7280", flexShrink: 0 }}
                />
                <span className="flex-1 truncate">{item.label}</span>
                {/* Premium badge for locked items */}
                {isPremiumLocked && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">PRO</span>
                )}
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

        {/* Quick Push to Top */}
        {listingId && (
          <div className="px-3 pb-3">
            <button
              onClick={handleQuickPush}
              disabled={quickPushing}
              className="w-full flex items-center gap-2 px-3 py-2 rounded text-sm font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg
                className={`w-3.5 h-3.5 flex-shrink-0 ${quickPushing ? "animate-spin" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                {quickPushing ? (
                  <circle cx="12" cy="12" r="10" strokeDasharray="40" strokeDashoffset="10" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                )}
              </svg>
              <span className="truncate">
                {pushPoints > 0 ? `Push to Top (${pushPoints})` : "Buy Push Points"}
              </span>
            </button>
          </div>
        )}

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
            Log out
          </button>
        </div>
      </aside>

      {/* ── Mobile drawer overlay ── */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setMobileDrawerOpen(false)}
          style={{ background: "rgba(0,0,0,0.4)" }} />
      )}

      {/* ── Mobile slide-up drawer ── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white transition-transform duration-300"
        style={{
          borderRadius: "20px 20px 0 0",
          boxShadow: "0 -4px 24px rgba(0,0,0,0.12)",
          transform: mobileDrawerOpen ? "translateY(0)" : "translateY(100%)",
          maxHeight: "80vh",
          overflowY: "auto",
        }}>
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div style={{ width: 36, height: 4, background: "#E5E5E5", borderRadius: 2 }} />
        </div>

        {/* All nav items */}
        <div className="px-4 pb-2">
          {allNavItems.map((item) => {
            const navItem = item as NavItem
            const isActive = item.href === "/dashboard"
              ? pathname === item.href
              : pathname.startsWith(item.href) && item.href !== "/create-profile"
                ? pathname.startsWith(item.href)
                : pathname === item.href
            const Icon = item.icon
            const isPremiumLocked = navItem.premiumOnly && !isPremium

            const handleMobileClick = (e: React.MouseEvent) => {
              setMobileDrawerOpen(false)
              if (isPremiumLocked) {
                e.preventDefault()
                setUpgradeFeature(navItem.label)
                setShowUpgradeModal(true)
              }
            }

            return (
              <Link
                key={item.href}
                href={isPremiumLocked ? "#" : item.href}
                onClick={handleMobileClick}
                className="flex items-center gap-3 px-3 py-3 rounded-xl transition-colors"
                style={{
                  background: isActive ? "#000" : "transparent",
                  color: isActive ? "#fff" : "#374151",
                  marginBottom: 2,
                  opacity: isPremiumLocked ? 0.7 : 1,
                }}
              >
                <Icon size={18} style={{ color: isActive ? "#fff" : "#6B7280", flexShrink: 0 }} />
                <span className="text-[14px] font-medium flex-1">{item.label}</span>
                {isPremiumLocked && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">PRO</span>
                )}
                {item.href === "/dashboard/beskeder" && totalUnread > 0 && (
                  <span className="text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: isActive ? "#fff" : "#000", color: isActive ? "#000" : "#fff" }}>
                    {totalUnread > 9 ? "9+" : totalUnread}
                  </span>
                )}
              </Link>
            )
          })}

          {/* Sign out in drawer */}
          <div style={{ borderTop: "1px solid #F3F4F6", marginTop: 8, paddingTop: 8, marginBottom: 16 }}>
            <button
              onClick={() => { setMobileDrawerOpen(false); handleSignOut() }}
              className="flex items-center gap-3 px-3 py-3 rounded-xl w-full text-[14px] font-medium"
              style={{ color: "#9CA3AF" }}
            >
              <LogOut size={18} style={{ flexShrink: 0 }} />
              Log out
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile bottom nav ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 flex md:hidden items-center justify-around bg-white py-2 px-1"
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

        {/* More button */}
        <button
          onClick={() => setMobileDrawerOpen(true)}
          className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={mobileDrawerOpen ? "#000" : "#9CA3AF"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
          </svg>
          <span className="text-[10px] font-medium" style={{ color: mobileDrawerOpen ? "#000" : "#9CA3AF" }}>More</span>
        </button>
      </nav>

      {/* ── Main content ── */}
      <main className="flex-1 ml-0 md:ml-60 p-4 md:p-8 pb-24 md:pb-8">
        {children}
      </main>

      {/* Upgrade to Premium Modal */}
      {showUpgradeModal && (
        <UpgradeToPremiumModal
          featureName={upgradeFeature}
          onClose={() => { setShowUpgradeModal(false); setUpgradeFeature(undefined) }}
        />
      )}
    </div>
  )
}
