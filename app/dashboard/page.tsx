"use client"
import { Suspense, useEffect, useState } from "react"
import { useLanguage } from "@/lib/i18n/LanguageContext"
import { useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase"
import DashboardLayout from "@/components/DashboardLayout"
import Link from "next/link"
import { FileText, Eye, MessageSquare, CheckCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import ProfileCompletionModal from "@/components/ProfileCompletionModal"
import { PUSH_POINT_PACKAGES } from "@/lib/spendPackages"

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
  const [checking, setChecking] = useState(true)
  const [showCompletion, setShowCompletion] = useState(false)
  const [listingId, setListingId] = useState<string | null>(null)
  const [listingSlug, setListingSlug] = useState<string | null>(null)
  const [shareCode, setShareCode] = useState<string | null>(null)
  const [listingPremium, setListingPremium] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
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
      setUserId(user.id)

      // Check if user has a listing and whether they have paid
      const { data: listing } = await supabase
        .from("listings")
        .select("id, slug, share_code, premium_tier, status")
        .eq("user_id", user.id)
        .limit(1)
        .single()

      // No listing at all → send to create-profile
      if (!listing) {
        router.replace("/create-profile")
        return
      }

      // Listing exists but no plan selected → send to choose-plan
      if (!listing.premium_tier) {
        router.replace("/choose-plan")
        return
      }

      setChecking(false)
      // Show completion modal when redirected from payment
      if (planActivated) setShowCompletion(true)

      if (listing?.id) {
        setListingId(listing.id)
        setListingSlug((listing as any).slug || null)
        setListingPremium(listing.premium_tier || null)
        const code = (listing as any).share_code
        setShareCode(code || null)
        // Auto-generate share_code if missing
        if (!code && listing.premium_tier) {
          const newCode = Math.random().toString(36).slice(2,6) + Math.random().toString(36).slice(2,6)
          supabase.from("listings").update({ share_code: newCode } as any).eq("id", listing.id).then(() => setShareCode(newCode))
        }
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

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-7 h-7 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <>
      {/* Profile Completion Modal */}
      {showCompletion && (
        <ProfileCompletionModal
          listingId={listingId}
          plan={plan}
          onClose={() => setShowCompletion(false)}
        />
      )}
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

        {/* Personal Link Card — premium only */}
        {listingPremium && ["vip","featured","basic"].includes(listingPremium) && (
          <div className="mb-8 rounded-2xl overflow-hidden border border-gray-900 bg-gray-950">
            <div className="px-5 py-4 border-b border-white/10">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-bold tracking-widest text-yellow-400 uppercase">✦ Premium Feature</span>
              </div>
              <h2 className="text-[17px] font-black text-white">Your personal link</h2>
              <p className="text-[13px] text-gray-400 mt-0.5">Share this link anywhere — it shows only your profile, no navigation, no distractions.</p>
            </div>
            <div className="px-5 py-4">
              {shareCode ? (
                <>
                  <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-3 mb-4">
                    <span className="text-[13px] text-gray-300 flex-1 truncate font-mono">
                      redlightad.com/me/{shareCode}
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`https://redlightad.com/me/${shareCode}`)
                        const el = document.getElementById("copy-feedback")
                        if (el) { el.textContent = "Copied!"; setTimeout(() => { if (el) el.textContent = "Copy" }, 2000) }
                      }}
                      className="text-[12px] font-bold text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors flex-shrink-0"
                    >
                      <span id="copy-feedback">Copy</span>
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={`/me/${shareCode}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 bg-white text-black text-[13px] font-bold py-2.5 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <Eye size={14} /> Preview my page
                    </a>
                    <button
                      onClick={async () => {
                        const url = `https://redlightad.com/me/${shareCode}`
                        if (navigator.share) {
                          await navigator.share({ title: "My profile", url })
                        } else {
                          navigator.clipboard.writeText(url)
                        }
                      }}
                      className="flex items-center gap-2 bg-white/10 text-white text-[13px] font-semibold px-4 py-2.5 rounded-xl hover:bg-white/20 transition-colors"
                    >
                      Share
                    </button>
                  </div>
                  <p className="text-[11px] text-gray-600 mt-3 text-center">
                    Share on Instagram, Twitter, Linktree, WhatsApp, Telegram — anywhere you want
                  </p>
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-[13px] text-gray-500 mb-3">Generating your personal link...</p>
                  <button
                    onClick={async () => {
                      await fetch("/api/internal/migrate-share-code?secret=" + "0aee441bfbeeb".slice(0,16))
                      window.location.reload()
                    }}
                    className="text-[12px] text-gray-400 hover:text-white transition-colors underline"
                  >
                    Generate link
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

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

        {/* Push to Top widget */}
        {listingId !== null && userId !== null && (
          <PushToTopWidget listingId={listingId} userId={userId} />
        )}

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
    </>  
  )
}

// ─── Payment Modal for Push Points ────────────────────────────────────────────
const CDN = "https://cdn.jsdelivr.net/npm/payment-icons/min/flat"
type PayMethod = "card" | "paypal" | "bank" | "paysafe" | "crypto"
const PAY_METHODS: { id: PayMethod; label: string; sub?: string }[] = [
  { id: "card",    label: "Credit or debit card" },
  { id: "paypal",  label: "PayPal" },
  { id: "bank",    label: "Instant Bank Transfer", sub: "Revolut, N26, Wise and more" },
  { id: "paysafe", label: "PaysafeCard" },
  { id: "crypto",  label: "CryptoCoins", sub: "Bitcoin, Ethereum & more" },
]

function PushPayModal({ pkg, userId, onClose }: {
  pkg: { id: string; points: number; price_usd: number; label: string }
  userId: string
  onClose: () => void
}) {
  const [method, setMethod] = useState<PayMethod>("card")
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cardNum, setCardNum] = useState("")
  const [expiry, setExpiry] = useState("")
  const [cvc, setCvc] = useState("")
  const [name, setName] = useState("")
  const [promoCode, setPromoCode] = useState("")
  const [promoApplied, setPromoApplied] = useState(false)
  const [discount, setDiscount] = useState(0)
  const finalPrice = discount > 0 ? Math.max(0, pkg.price_usd * (1 - discount / 100)) : pkg.price_usd

  const fmtCard = (v: string) => v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim()
  const fmtExp  = (v: string) => { const d = v.replace(/\D/g, "").slice(0, 4); return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d }

  const applyPromo = async () => {
    if (!promoCode.trim()) return
    try {
      const res = await fetch("/api/promo/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoCode }),
      })
      const data = await res.json()
      if (data.valid && data.discount_percent) {
        setDiscount(data.discount_percent)
        setPromoApplied(true)
      } else {
        setError(data.error || "Invalid promo code")
      }
    } catch { setError("Could not validate code") }
  }

  const handlePay = async () => {
    setProcessing(true)
    setError(null)
    try {
      if (method === "crypto") {
        const res = await fetch("/api/push-points/crypto-checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ packageId: pkg.id, userId }),
        })
        const data = await res.json()
        if (data.url) { window.location.href = data.url; return }
        throw new Error(data.error || "Crypto payment failed")
      }
      if (method === "card") {
        const res = await fetch("/api/push-points/stripe-checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ packageId: pkg.id, userId }),
        })
        const data = await res.json()
        if (data.url) { window.location.href = data.url; return }
        throw new Error(data.error || "Card payment failed")
      }
      setError(`${method} coming soon. Use card or crypto.`)
      setProcessing(false)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Payment error. Try again.")
      setProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full sm:max-w-md max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-[#111] text-white"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="sticky top-0 z-10 flex items-center gap-3 px-5 py-4 rounded-t-3xl"
          style={{ background: "linear-gradient(135deg, #1a0000 0%, #3d0000 50%, #1a0000 100%)" }}
        >
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="flex-1">
            <p className="text-sm font-black text-white">{pkg.points} Push Points</p>
            <p className="text-xs text-[#f5a623] font-semibold">{pkg.points} × Push to Top</p>
          </div>
          <p className="text-sm font-black tabular-nums text-white">€{finalPrice.toFixed(2)}</p>
        </div>

        <div className="px-5 py-4 space-y-3">
          {/* Payment methods */}
          <div className="rounded-2xl overflow-hidden border border-[#2a2a2a]">
            {PAY_METHODS.map((m, i) => {
              const isSel = method === m.id
              return (
                <button
                  key={m.id}
                  onClick={() => setMethod(m.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 transition-colors ${
                    i > 0 ? "border-t border-[#222]" : ""
                  } ${isSel ? "bg-white" : "bg-[#1a1a1a] hover:bg-[#222]"}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                      isSel ? "border-black bg-black" : "border-[#555]"
                    }`}>
                      {isSel && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <div className="text-left min-w-0">
                      <p className={`text-sm font-semibold leading-tight ${isSel ? "text-black" : "text-white"}`}>{m.label}</p>
                      {m.sub && <p className="text-xs text-gray-500 leading-tight mt-0.5">{m.sub}</p>}
                    </div>
                  </div>
                  {/* Method icons */}
                  <div className="flex-shrink-0 ml-2 flex items-center gap-1">
                    {m.id === "card" && (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={`${CDN}/visa.svg`} alt="Visa" style={{ height: 20, width: "auto", borderRadius: 3 }} />
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={`${CDN}/mastercard.svg`} alt="MC" style={{ height: 20, width: "auto", borderRadius: 3 }} />
                      </>
                    )}
                    {m.id === "paypal" && (
                      <span className="inline-flex items-center justify-center bg-white rounded px-2" style={{ height: 22 }}>
                        <svg height="12" viewBox="0 0 60 16" fill="none">
                          <text y="12" fontFamily="Arial" fontSize="11" fontWeight="800" fill="#003087">Pay</text>
                          <text x="22" y="12" fontFamily="Arial" fontSize="11" fontWeight="800" fill="#009CDE">Pal</text>
                        </svg>
                      </span>
                    )}
                    {m.id === "bank" && (
                      <span className="inline-flex items-center justify-center bg-[#9FE870] rounded px-2" style={{ height: 20 }}>
                        <svg height="9" viewBox="0 0 28 9"><text y="8" fontFamily="Arial Black" fontSize="8" fontWeight="900" fill="#163300">WISE</text></svg>
                      </span>
                    )}
                    {m.id === "paysafe" && (
                      <span className="inline-flex items-center justify-center bg-white rounded px-2" style={{ height: 20 }}>
                        <svg height="9" viewBox="0 0 55 9">
                          <text y="8" fontFamily="Arial" fontSize="8" fontWeight="800" fill="#003082">paysafe</text>
                          <text x="38" y="8" fontFamily="Arial" fontSize="8" fontWeight="800" fill="#009EE2">card</text>
                        </svg>
                      </span>
                    )}
                    {m.id === "crypto" && (
                      <>
                        <span className="inline-flex items-center justify-center rounded-full" style={{ width: 20, height: 20, background: "#F7931A" }}>
                          <svg height="10" viewBox="0 0 12 12"><text x="2" y="9" fontFamily="Arial Black" fontSize="9" fontWeight="900" fill="white">₿</text></svg>
                        </span>
                        <span className="inline-flex items-center justify-center rounded-full" style={{ width: 20, height: 20, background: "#26A17B" }}>
                          <svg height="10" viewBox="0 0 12 12"><text x="2" y="9" fontFamily="Arial Black" fontSize="9" fontWeight="900" fill="white">T</text></svg>
                        </span>
                      </>
                    )}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Card form */}
          {method === "card" && (
            <div className="rounded-2xl border border-[#2a2a2a] bg-[#1a1a1a] p-4 space-y-3">
              <input
                type="text" inputMode="numeric" placeholder="Card number"
                value={cardNum} onChange={e => setCardNum(fmtCard(e.target.value))}
                className="w-full bg-[#111] border border-[#333] rounded-xl px-4 py-3 text-white text-sm placeholder-[#555] focus:outline-none focus:border-[#f5a623] font-mono tracking-widest"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text" inputMode="numeric" placeholder="MM/YY"
                  value={expiry} onChange={e => setExpiry(fmtExp(e.target.value))}
                  className="w-full bg-[#111] border border-[#333] rounded-xl px-4 py-3 text-white text-sm placeholder-[#555] focus:outline-none focus:border-[#f5a623] font-mono"
                />
                <input
                  type="text" inputMode="numeric" placeholder="CVC"
                  value={cvc} onChange={e => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  className="w-full bg-[#111] border border-[#333] rounded-xl px-4 py-3 text-white text-sm placeholder-[#555] focus:outline-none focus:border-[#f5a623] font-mono"
                />
              </div>
              <input
                type="text" placeholder="Name on card"
                value={name} onChange={e => setName(e.target.value)}
                className="w-full bg-[#111] border border-[#333] rounded-xl px-4 py-3 text-white text-sm placeholder-[#555] focus:outline-none focus:border-[#f5a623]"
              />
            </div>
          )}

          {/* Promo code */}
          <div className="rounded-2xl border border-[#2a2a2a] bg-[#1a1a1a] p-4">
            <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest mb-2">Promo code</p>
            {promoApplied ? (
              <div className="flex items-center gap-2 text-green-400 text-sm">
                <span>✓ {promoCode.toUpperCase()} — {discount}% off</span>
                <button onClick={() => { setPromoApplied(false); setDiscount(0); setPromoCode("") }} className="ml-auto text-gray-500 hover:text-white text-xs">Remove</button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text" placeholder="Enter promo code"
                  value={promoCode} onChange={e => setPromoCode(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === "Enter" && applyPromo()}
                  className="flex-1 bg-[#111] border border-[#333] rounded-xl px-4 py-2.5 text-white text-sm placeholder-[#555] focus:outline-none focus:border-[#f5a623] uppercase tracking-widest"
                />
                <button onClick={applyPromo} className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-bold transition-colors flex-shrink-0">Apply</button>
              </div>
            )}
          </div>

          {error && (
            <div className="rounded-xl bg-red-900/30 border border-red-800/50 px-4 py-3 text-sm text-red-400">{error}</div>
          )}

          {/* CTA */}
          <button
            onClick={handlePay}
            disabled={processing}
            className="w-full py-4 rounded-xl bg-[#f5a623] hover:bg-[#e69520] text-black font-black text-base tracking-widest uppercase disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {processing ? (
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={3} strokeDasharray="40" strokeDashoffset="10" />
              </svg>
            ) : null}
            {processing ? "Processing..." : `Buy ${pkg.points} Points — €${finalPrice.toFixed(2)}`}
          </button>

          {/* Trust */}
          <div className="text-center pb-2">
            <p className="text-[10px] text-gray-600">Secure payment · No subscription · Points added instantly</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Push to Top Widget ────────────────────────────────────────────────────────
function PushToTopWidget({ listingId, userId }: { listingId: string; userId: string }) {
  const [points, setPoints] = useState<number | null>(null)
  const [pushing, setPushing] = useState(false)
  const [modalPkg, setModalPkg] = useState<{ id: string; points: number; price_usd: number; label: string } | null>(null)
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from("wallets")
      .select("push_points")
      .eq("user_id", userId)
      .single()
      .then(({ data }) => setPoints(data?.push_points ?? 0))
  }, [userId])

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 4000)
  }

  const handlePush = async () => {
    if (!listingId) return
    setPushing(true)
    const supabase = createClient()
    const token = (await supabase.auth.getSession()).data.session?.access_token
    const res = await fetch("/api/push-points/push", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ listingId }),
    })
    const data = await res.json()
    setPushing(false)
    if (res.ok) {
      setPoints(data.points_remaining)
      showToast("success", "\uD83D\uDE80 Your profile is now at the top!")
    } else if (data.error === "insufficient_points") {
      showToast("error", "No push points. Buy a package below.")
    } else {
      showToast("error", data.error || "Something went wrong")
    }
  }

  return (
    <>
      {/* Payment modal */}
      {modalPkg && (
        <PushPayModal
          pkg={modalPkg}
          userId={userId}
          onClose={() => setModalPkg(null)}
        />
      )}

      <div
        className="bg-white border border-gray-100 rounded-none p-5 mb-6"
        style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
      >
        {toast && (
          <div
            className={`mb-4 px-4 py-2.5 rounded text-sm font-medium ${
              toast.type === "success"
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {toast.msg}
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
              </svg>
              Push to Top
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Move your profile to the top of search results instantly. 1 push = 1 point.
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">{points ?? "\u2014"}</div>
            <div className="text-[11px] text-gray-400">points left</div>
          </div>
        </div>

        {/* Push button */}
        {(points ?? 0) > 0 ? (
          <button
            onClick={handlePush}
            disabled={pushing}
            className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-sm py-2.5 rounded transition-colors disabled:opacity-60 mb-5"
          >
            {pushing ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={3} strokeDasharray="40" strokeDashoffset="10" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
              </svg>
            )}
            {pushing ? "Pushing..." : "Push to Top Now"}
          </button>
        ) : (
          <div className="text-center py-3 mb-5 bg-gray-50 border border-gray-100 rounded text-sm text-gray-500">
            No push points \u2014 buy a package below to get started
          </div>
        )}

        {/* Packages — klik åbner betalingsmodal */}
        <div className="grid grid-cols-3 gap-2">
          {PUSH_POINT_PACKAGES.map((pkg) => (
            <button
              key={pkg.id}
              onClick={() => setModalPkg({ id: pkg.id, points: pkg.points, price_usd: pkg.price_usd, label: pkg.label })}
              className={`relative border rounded p-3 text-left transition-all hover:border-red-300 hover:bg-red-50 ${
                pkg.popular ? "border-red-400 bg-red-50" : "border-gray-200"
              }`}
            >
              {pkg.popular && (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                  POPULAR
                </span>
              )}
              <div className="font-bold text-gray-900 text-lg">{pkg.points}</div>
              <div className="text-[10px] text-gray-500 font-medium">pushes</div>
              <div className="text-sm font-semibold text-red-600 mt-1">&euro;{pkg.price_usd}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">{pkg.description}</div>
            </button>
          ))}
        </div>
      </div>
    </>
  )
}

export default function DashboardPage() {
  return <Suspense><DashboardContent /></Suspense>
}
