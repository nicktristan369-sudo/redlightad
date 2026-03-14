"use client"
import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [email, setEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.replace("/login")
        return
      }
      setEmail(user.email ?? null)
      setLoading(false)
    })
  }, [router])

  const navItems = [
    { href: "/admin", label: "Dashboard", icon: "🏠" },
    { href: "/admin/annoncer", label: "Annoncer", icon: "📋" },
    { href: "/admin/brugere", label: "Brugere", icon: "👥" },
    { href: "/admin/udbetalinger", label: "Udbetalinger", icon: "🏦" },
    { href: "/admin/indstillinger", label: "Indstillinger", icon: "⚙️" },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Mobile top bar */}
      <div className="flex md:hidden items-center justify-between bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-20">
        <span className="text-lg font-bold">Admin <span className="text-red-600">Panel</span></span>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg hover:bg-gray-100"
        >
          {mobileMenuOpen ? (
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          ) : (
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          )}
        </button>
      </div>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-200 px-4 pb-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-red-50 text-red-600 border border-red-100"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
          <Link
            href="/dashboard"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            <span>←</span>
            Tilbage til dashboard
          </Link>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 bg-white border-r border-gray-200 flex-col fixed h-full z-10">
        <div className="p-6 border-b border-gray-100">
          <Link href="/admin" className="text-xl font-bold">
            Admin <span className="text-red-600">Panel</span>
          </Link>
          <p className="text-xs text-gray-500 mt-1 truncate">{email}</p>
        </div>

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
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors w-full"
          >
            <span>←</span>
            Tilbage til dashboard
          </Link>
        </div>
      </aside>

      <main className="flex-1 ml-0 md:ml-64 p-4 md:p-8">
        {children}
      </main>
    </div>
  )
}
