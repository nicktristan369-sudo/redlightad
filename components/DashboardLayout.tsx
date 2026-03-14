"use client"
import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase"

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

      // Check admin via RPC (SECURITY DEFINER — bypasser RLS)
      const { data: adminStatus } = await supabase.rpc("get_my_admin_status")
      setIsAdmin(!!adminStatus)

      // Fetch unread count
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

  const navItems = [
    { href: "/dashboard", label: "Oversigt", icon: "📊" },
    { href: "/dashboard/annoncer", label: "Mine annoncer", icon: "📋" },
    { href: "/opret-annonce", label: "Opret annonce", icon: "➕" },
    { href: "/dashboard/beskeder", label: "Beskeder", icon: "💬" },
    { href: "/dashboard/wallet", label: "Wallet", icon: "🔴" },
    { href: "/dashboard/buy-coins", label: "Køb coins", icon: "💳" },
    { href: "/dashboard/profil", label: "Profil indstillinger", icon: "⚙️" },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const bottomNavItems = navItems.slice(0, 5)

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar — hidden on mobile */}
      <aside className="hidden md:flex w-64 bg-white border-r border-gray-200 flex-col fixed h-full z-10">
        {/* Logo */}
        <div className="p-6 border-b border-gray-100">
          <Link href="/" className="text-xl font-bold">
            RED<span className="text-red-600">LIGHT</span>AD
          </Link>
          <p className="text-xs text-gray-500 mt-1 truncate">{email}</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-red-50 text-red-600 border border-red-100"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
                {item.href === "/dashboard/beskeder" && totalUnread > 0 && (
                  <span className="ml-auto bg-red-600 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {totalUnread}
                  </span>
                )}
              </Link>
            )
          })}

          {/* Admin link — kun synlig for admins */}
          {isAdmin && (
            <div className="pt-2 mt-2 border-t border-gray-100">
              <Link
                href="/admin"
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  pathname.startsWith("/admin")
                    ? "bg-red-50 text-red-600 border border-red-100"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <span>🛡️</span>
                Admin panel
              </Link>
            </div>
          )}
        </nav>

        {/* Sign out */}
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors w-full"
          >
            <span>🚪</span>
            Log ud
          </button>
        </div>
      </aside>

      {/* Bottom navigation bar — mobile only */}
      <nav className="fixed bottom-0 left-0 right-0 z-20 flex md:hidden items-center justify-around bg-white border-t border-gray-200 py-2 px-1">
        {bottomNavItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] font-medium transition-colors relative ${
                isActive ? "text-red-600" : "text-gray-500"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="truncate max-w-[60px]">{item.label.split(" ")[0]}</span>
              {item.href === "/dashboard/beskeder" && totalUnread > 0 && (
                <span className="absolute -top-0.5 right-0 bg-red-600 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {totalUnread}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Main content */}
      <main className="flex-1 ml-0 md:ml-64 p-4 md:p-8 pb-20 md:pb-8">
        {children}
      </main>
    </div>
  )
}
