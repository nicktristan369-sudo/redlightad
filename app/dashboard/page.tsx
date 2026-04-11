"use client"
import { Suspense, useEffect, useState } from "react"
import { useLanguage } from "@/lib/i18n/LanguageContext"
import { useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase"
import DashboardLayout from "@/components/DashboardLayout"
import Link from "next/link"
import { FileText, Eye, MessageSquare, CheckCircle } from "lucide-react"
import { useRouter } from "next/navigation"

const STATS = [
  { label: "Active listings", value: "0", Icon: FileText },
  { label: "Views today",     value: "0", Icon: Eye },
  { label: "New messages",    value: "0", Icon: MessageSquare },
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
  const router = useRouter()
  const upgraded = searchParams.get("upgraded")
  const planActivated = searchParams.get("plan_activated")
  const plan = searchParams.get("plan")
  const tier = searchParams.get("tier")
  const [listingId, setListingId] = useState<string | null>(null)
  const [camStatus, setCamStatus] = useState<"offline"|"available"|"scheduled">("offline")
  const [camAvailableUntil, setCamAvailableUntil] = useState<string|null>(null)
  const [camScheduledAt, setCamScheduledAt] = useState<string|null>(null)
  const [selectedDuration, setSelectedDuration] = useState<number>(2)
  const [scheduledDateTime, setScheduledDateTime] = useState("")
  const [camStatusSaving, setCamStatusSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return

      // Check if user has a listing and whether they have paid
      const { data: listing } = await supabase
        .from("listings")
        .select("id, premium_tier, status")
        .eq("user_id", user.id)
        .limit(1)
        .single()

      // If listing exists but no plan selected → send to choose-plan
      if (listing && !listing.premium_tier) {
        router.replace("/choose-plan")
        return
      }

      if (listing?.id) {
        setListingId(listing.id)
        // Fetch cam availability
        const res = await fetch(`/api/cam/availability?listingId=${listing.id}`)
        const d = await res.json()
        if (d.cam_status) setCamStatus(d.cam_status)
        if (d.cam_available_until) setCamAvailableUntil(d.cam_available_until)
        if (d.cam_scheduled_at) setCamScheduledAt(d.cam_scheduled_at)
      }
    })
  }, [router])

  const saveCamStatus = async (newStatus: "offline"|"available"|"scheduled") => {
    setCamStatusSaving(true)
    const { data: { session } } = await supabase.auth.getSession()
    const availableUntil = newStatus === "available"
      ? new Date(Date.now() + selectedDuration * 3600000).toISOString()
      : undefined
    await fetch("/api/cam/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session?.access_token}` },
      body: JSON.stringify({ listingId, status: newStatus, availableUntil, scheduledAt: newStatus === "scheduled" ? scheduledDateTime : undefined }),
    })
    setCamStatus(newStatus)
    if (availableUntil) setCamAvailableUntil(availableUntil)
    if (newStatus === "scheduled" && scheduledDateTime) setCamScheduledAt(scheduledDateTime)
    if (newStatus === "offline") { setCamAvailableUntil(null); setCamScheduledAt(null) }
    setCamStatusSaving(false)
  }

  return (
    <DashboardLayout>
      <div>
        {/* Plan activated banner */}
        {planActivated && (
          <div className="mb-6 rounded-2xl overflow-hidden" style={{ border: "1px solid #BBF7D0" }}>
            <div className="bg-green-600 px-5 py-4 flex items-center gap-3">
              <CheckCircle size={22} color="#fff" className="flex-shrink-0" />
              <div>
                <p className="text-[15px] font-bold text-white">🎉 Your profile is now active!</p>
                <p className="text-[13px] text-green-100">Payment confirmed — your {plan?.toUpperCase()} plan is live.</p>
              </div>
            </div>
            <div className="bg-green-50 px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <p className="text-[13px] text-green-800 flex-1">Your profile is now visible on RedLightAD and clients can find you.</p>
              {listingId && (
                <a
                  href={`/ads/${listingId}`}
                  className="inline-flex items-center gap-2 bg-green-600 text-white text-[13px] font-semibold px-4 py-2 rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap"
                >
                  <Eye size={14} /> View my profile
                </a>
              )}
            </div>
          </div>
        )}

        {/* Upgrade success banner */}
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
          <h1 className="text-[24px] font-bold text-gray-900">Overview</h1>
          <p className="text-[14px] text-gray-400 mt-0.5">Welcome to your dashboard</p>
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
          <h2 className="text-[15px] font-semibold text-gray-900 mb-4">Quick actions</h2>
          {listingId !== null ? (
            <div className="flex flex-wrap gap-3">
              <QuickBtn href={`/dashboard/annoncer/${listingId}/edit`} style="black">Edit my profile</QuickBtn>
              <Link
                href={`/ads/${listingId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 rounded-lg text-[13px] font-semibold inline-block transition-colors duration-200"
                style={{ background: "#fff", border: "1px solid #000", color: "#000" }}
              >
                Preview
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
                href="/create-profile"
                className="px-8 py-4 rounded-lg text-[15px] font-semibold inline-block transition-colors duration-200"
                style={{ background: "#CC0000", color: "#fff" }}
              >
                Create your profile
              </Link>
              <p className="text-[13px] text-gray-500 mt-3">
                You have not created your profile yet. Get started now!
              </p>
            </div>
          )}
        </div>

        {/* REDLIGHTCAM availability widget */}
        {listingId !== null && (
          <div style={{ background: "#fff", border: "1px solid #E5E5E5", borderRadius: 16, overflow: "hidden", marginBottom: 24 }}>
            {/* Header */}
            <div style={{ background: "#111", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 15, fontWeight: 900, letterSpacing: "-0.01em" }}>
                <span style={{ color: "#DC2626" }}>RED</span>
                <span style={{ color: "#fff" }}>LIGHT</span>
                <span style={{ color: "#DC2626" }}>CAM</span>
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600 }}>
                <span style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: camStatus === "available" ? "#22C55E" : camStatus === "scheduled" ? "#F59E0B" : "#6B7280",
                  boxShadow: camStatus === "available" ? "0 0 6px #22C55E" : "none"
                }} />
                <span style={{ color: camStatus === "available" ? "#22C55E" : camStatus === "scheduled" ? "#F59E0B" : "#9CA3AF" }}>
                  {camStatus === "available" ? "Available now" : camStatus === "scheduled" ? "Scheduled" : "Offline"}
                </span>
              </span>
            </div>

            {/* Body */}
            <div style={{ padding: "16px 20px" }}>
              {/* Go Live button */}
              <Link href="/dashboard/go-live" style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                padding: "11px 0", background: "#DC2626", color: "#fff", borderRadius: 10,
                fontSize: 14, fontWeight: 700, textDecoration: "none", marginBottom: 14
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                Go Live Now
              </Link>

              {/* Divider */}
              <div style={{ borderTop: "1px solid #F3F4F6", marginBottom: 14 }} />

              {/* Status options */}
              <p style={{ fontSize: 12, fontWeight: 600, color: "#6B7280", textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: 10 }}>Set availability</p>

              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <button
                  onClick={() => setCamStatus(camStatus === "available" ? "offline" : "available")}
                  style={{
                    flex: 1, padding: "9px 0", borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: "pointer",
                    border: camStatus === "available" ? "2px solid #22C55E" : "1px solid #E5E5E5",
                    background: camStatus === "available" ? "#F0FDF4" : "#fff",
                    color: camStatus === "available" ? "#16A34A" : "#374151"
                  }}
                >
                  Ready now
                </button>
                <button
                  onClick={() => setCamStatus(camStatus === "scheduled" ? "offline" : "scheduled")}
                  style={{
                    flex: 1, padding: "9px 0", borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: "pointer",
                    border: camStatus === "scheduled" ? "2px solid #F59E0B" : "1px solid #E5E5E5",
                    background: camStatus === "scheduled" ? "#FFFBEB" : "#fff",
                    color: camStatus === "scheduled" ? "#D97706" : "#374151"
                  }}
                >
                  Schedule
                </button>
                {camStatus !== "offline" && (
                  <button
                    onClick={() => saveCamStatus("offline")}
                    style={{
                      padding: "9px 14px", borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: "pointer",
                      border: "1px solid #E5E5E5", background: "#fff", color: "#9CA3AF"
                    }}
                  >
                    Offline
                  </button>
                )}
              </div>

              {/* Duration picker for "available" */}
              {camStatus === "available" && (
                <div style={{ marginBottom: 12 }}>
                  <p style={{ fontSize: 12, color: "#6B7280", marginBottom: 8 }}>Available for:</p>
                  <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                    {[1, 2, 4, 8].map(h => (
                      <button key={h} onClick={() => setSelectedDuration(h)}
                        style={{
                          flex: 1, padding: "7px 0", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
                          border: selectedDuration === h ? "2px solid #22C55E" : "1px solid #E5E5E5",
                          background: selectedDuration === h ? "#F0FDF4" : "#fff",
                          color: selectedDuration === h ? "#16A34A" : "#6B7280"
                        }}>
                        {h}h
                      </button>
                    ))}
                  </div>
                  <button onClick={() => saveCamStatus("available")} disabled={camStatusSaving}
                    style={{
                      width: "100%", padding: "10px 0", borderRadius: 9, fontSize: 13, fontWeight: 700,
                      background: "#111", color: "#fff", border: "none", cursor: "pointer",
                      opacity: camStatusSaving ? 0.6 : 1
                    }}>
                    {camStatusSaving ? "Saving..." : "Set as Available"}
                  </button>
                </div>
              )}

              {/* Schedule picker */}
              {camStatus === "scheduled" && (
                <div style={{ marginBottom: 12 }}>
                  <p style={{ fontSize: 12, color: "#6B7280", marginBottom: 8 }}>Go live at:</p>
                  <input type="datetime-local" value={scheduledDateTime} onChange={e => setScheduledDateTime(e.target.value)}
                    style={{
                      width: "100%", padding: "9px 12px", borderRadius: 9, border: "1px solid #E5E5E5",
                      fontSize: 13, marginBottom: 10, boxSizing: "border-box" as const, outline: "none"
                    }} />
                  <button onClick={() => saveCamStatus("scheduled")} disabled={!scheduledDateTime || camStatusSaving}
                    style={{
                      width: "100%", padding: "10px 0", borderRadius: 9, fontSize: 13, fontWeight: 700,
                      background: "#111", color: "#fff", border: "none", cursor: "pointer",
                      opacity: !scheduledDateTime || camStatusSaving ? 0.5 : 1
                    }}>
                    {camStatusSaving ? "Saving..." : "Set Schedule"}
                  </button>
                </div>
              )}

              {/* Current status info */}
              {camStatus === "available" && camAvailableUntil && (
                <p style={{ fontSize: 12, color: "#22C55E", textAlign: "center" }}>
                  Available until {new Date(camAvailableUntil).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              )}
              {camStatus === "scheduled" && camScheduledAt && (
                <p style={{ fontSize: 12, color: "#F59E0B", textAlign: "center" }}>
                  Scheduled for {new Date(camScheduledAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default function DashboardPage() {
  return <Suspense><DashboardContent /></Suspense>
}
