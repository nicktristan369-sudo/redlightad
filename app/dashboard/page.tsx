"use client"
import { Suspense, useEffect, useState } from "react"
import { useLanguage } from "@/lib/i18n/LanguageContext"
import { useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase"
import DashboardLayout from "@/components/DashboardLayout"
import Link from "next/link"
import { FileText, Eye, MessageSquare, CheckCircle } from "lucide-react"

const STATS = [
  { label: "Aktive annoncer", value: "0", Icon: FileText },
  { label: "Visninger i dag",  value: "0", Icon: Eye },
  { label: "Nye beskeder",     value: "0", Icon: MessageSquare },
]

function QuickBtn({
  href,
  style,
  children,
}: {
  href: string
  style: "black" | "outline" | "gold"
  children: React.ReactNode
}) {
  const [hov, setHov] = useState(false)
  const base = "px-5 py-2.5 rounded-lg text-[13px] font-semibold transition-colors duration-200 inline-block"

  const bg =
    style === "black"
      ? hov ? "#CC0000" : "#000"
      : style === "gold"
      ? hov ? "#B8973F" : "#C9A84C"
      : hov ? "#F5F5F5" : "#fff"

  const border = style === "outline" ? "1px solid #000" : "1px solid transparent"
  const color = style === "outline" ? "#000" : "#fff"

  return (
    <Link
      href={href}
      className={base}
      style={{ background: bg, border, color }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      {children}
    </Link>
  )
}

function DashboardContent() {
  const { t } = useLanguage()
  const searchParams = useSearchParams()
  const upgraded = searchParams.get("upgraded")
  const tier = searchParams.get("tier")
  const [listingId, setListingId] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data: listing } = await supabase
        .from("listings").select("id").eq("user_id", user.id).eq("status", "active").limit(1).single()
      setListingId(listing?.id ?? null)
    })
  }, [])

  return (
    <DashboardLayout>
      <div>
        {/* Success banner */}
        {upgraded && (
          <div className="flex items-center gap-3 mb-6 px-4 py-3 rounded-xl"
            style={{ background: "#F0FDF4", border: "1px solid #BBF7D0" }}>
            <CheckCircle size={18} color="#16A34A" className="flex-shrink-0" />
            <div>
              <p className="text-[14px] font-semibold text-green-800">Payment successful!</p>
              <p className="text-[13px] text-green-600">
                Your listing has been upgraded to {tier?.toUpperCase()}. See Mine annoncer for status.
              </p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-[24px] font-bold text-gray-900">Oversigt</h1>
          <p className="text-[14px] text-gray-400 mt-0.5">Velkommen til dit dashboard</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {STATS.map(({ label, value, Icon }) => (
            <div key={label} className="bg-white p-5"
              style={{ border: "1px solid #E5E5E5", borderRadius: "12px" }}>
              <Icon size={20} color="#9CA3AF" />
              <p className="text-[32px] font-bold text-gray-900 mt-3 leading-none">{value}</p>
              <p className="text-[13px] mt-1.5" style={{ color: "#6B7280" }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="bg-white p-6 mb-6"
          style={{ border: "1px solid #E5E5E5", borderRadius: "12px" }}>
          <h2 className="text-[15px] font-semibold text-gray-900 mb-4">Hurtige handlinger</h2>
          {listingId !== null ? (
            <div className="flex flex-wrap gap-3">
              <QuickBtn href={`/dashboard/annoncer/${listingId}/edit`} style="black">Rediger min profil</QuickBtn>
              <Link
                href={`/ads/${listingId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 rounded-lg text-[13px] font-semibold inline-block transition-colors duration-200"
                style={{ background: "#fff", border: "1px solid #000", color: "#000" }}
              >
                Forhåndsvisning
              </Link>
              <QuickBtn href="/dashboard/boost" style="gold">Premium &amp; Boost</QuickBtn>
              <QuickBtn href="/dashboard/stories" style="outline">{t.dash_stories}</QuickBtn>
              <QuickBtn href="/dashboard/travel" style="outline">{t.dash_travel}</QuickBtn>
              <QuickBtn href="/dashboard/marketplace" style="outline">{t.dash_marketplace}</QuickBtn>
              <QuickBtn href="/dashboard/earnings" style="outline">{t.dash_earnings}</QuickBtn>
              <QuickBtn href="/dashboard/verify" style="outline">{t.dash_verification}</QuickBtn>
            </div>
          ) : (
            <div>
              <Link
                href="/opret-annonce"
                className="px-8 py-4 rounded-lg text-[15px] font-semibold inline-block transition-colors duration-200"
                style={{ background: "#CC0000", color: "#fff" }}
              >
                Opret din profil
              </Link>
              <p className="text-[13px] text-gray-500 mt-3">
                Du har endnu ikke oprettet din profil. Kom i gang nu!
              </p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

export default function DashboardPage() {
  return <Suspense><DashboardContent /></Suspense>
}
