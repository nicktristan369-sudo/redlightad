"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase"
import DashboardLayout from "@/components/DashboardLayout"
import { Lock, Unlock, Save, Info } from "lucide-react"

const PLATFORMS = [
  { id: "whatsapp",  label: "WhatsApp",    bg: "#25D366", icon: "https://cdn.simpleicons.org/whatsapp/ffffff" },
  { id: "telegram",  label: "Telegram",    bg: "#26A5E4", icon: "https://cdn.simpleicons.org/telegram/ffffff" },
  { id: "snapchat",  label: "Snapchat",    bg: "#FFFC00", icon: "https://cdn.simpleicons.org/snapchat/000000" },
  { id: "instagram", label: "Instagram",   bg: "#E1306C", icon: "https://cdn.simpleicons.org/instagram/ffffff" },
  { id: "onlyfans",  label: "OnlyFans",    bg: "#00AFF0", icon: "https://cdn.simpleicons.org/onlyfans/ffffff" },
  { id: "twitter_x", label: "X (Twitter)", bg: "#000000", icon: "https://cdn.simpleicons.org/x/ffffff" },
  { id: "signal",    label: "Signal",      bg: "#3A76F0", icon: "https://cdn.simpleicons.org/signal/ffffff" },
]

interface LinkConfig {
  url: string
  locked: boolean
  price_coins: number
}

type LinksState = Record<string, LinkConfig>

export default function SocialLinksPage() {
  const [links, setLinks] = useState<LinksState>({})
  const [listingId, setListingId] = useState<string | null>(null)
  const [isPremium, setIsPremium] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: listing } = await supabase
        .from("listings")
        .select("id, social_links, premium_tier")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle()

      if (listing) {
        setListingId(listing.id)
        setLinks(listing.social_links ?? {})
        setIsPremium(["basic", "featured", "vip"].includes(listing.premium_tier ?? ""))
      }
      setLoading(false)
    }
    load()
  }, [])

  const update = (platform: string, field: keyof LinkConfig, val: string | boolean | number) => {
    setLinks(prev => ({
      ...prev,
      [platform]: { ...{ url: "", locked: false, price_coins: 0 }, ...prev[platform], [field]: val }
    }))
  }

  const save = async () => {
    if (!listingId) return
    setSaving(true)
    setError("")
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    const token = (await supabase.auth.getSession()).data.session?.access_token
    const res = await fetch(`/api/listings/${listingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({ social_links: links }),
    })

    if (res.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } else {
      setError("Failed to save. Try again.")
    }
    setSaving(false)
  }

  if (loading) return (
    <DashboardLayout>
      <div style={{ padding: 40, textAlign: "center", color: "#9CA3AF" }}>Loading...</div>
    </DashboardLayout>
  )

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "24px 16px" }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#111", marginBottom: 4 }}>Social Media Links</h1>
          <p style={{ fontSize: 14, color: "#6B7280" }}>Add your social media profiles. Premium users can lock links behind a RedCoins paywall.</p>
        </div>

        {/* Premium lock info */}
        {!isPremium && (
          <div style={{ background: "#FFF7ED", border: "1px solid #FED7AA", borderLeft: "3px solid #F97316", borderRadius: 10, padding: "12px 14px", marginBottom: 20, display: "flex", gap: 10 }}>
            <Info size={16} color="#F97316" style={{ flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 13, color: "#92400E", margin: 0 }}>
              <strong>Premium feature:</strong> Locking social media links behind a RedCoins price requires a premium profile (Basic, Featured, or VIP).
              <a href="/upgrade" style={{ color: "#DC2626", marginLeft: 4, fontWeight: 600 }}>Upgrade →</a>
            </p>
          </div>
        )}

        {/* Platform rows */}
        <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 14, overflow: "hidden", marginBottom: 20 }}>
          {PLATFORMS.map((p, i) => {
            const cfg: LinkConfig = links[p.id] ?? { url: "", locked: false, price_coins: 0 }
            const isLocked = cfg.locked && isPremium

            return (
              <div key={p.id} style={{ padding: "16px 20px", borderBottom: i < PLATFORMS.length - 1 ? "1px solid #F3F4F6" : "none" }}>
                {/* Platform header */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: p.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <img src={p.icon} alt={p.label} style={{ width: 18, height: 18 }} />
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#111", flex: 1 }}>{p.label}</span>

                  {/* Lock toggle (premium only) */}
                  {isPremium && cfg.url && (
                    <button
                      type="button"
                      onClick={() => update(p.id, "locked", !cfg.locked)}
                      style={{
                        display: "flex", alignItems: "center", gap: 5,
                        padding: "5px 10px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600,
                        background: isLocked ? "#FEF2F2" : "#F3F4F6",
                        color: isLocked ? "#DC2626" : "#6B7280",
                      }}
                    >
                      {isLocked ? <Lock size={12} /> : <Unlock size={12} />}
                      {isLocked ? "Locked" : "Public"}
                    </button>
                  )}
                </div>

                {/* URL input */}
                <input
                  type="text"
                  value={cfg.url}
                  onChange={e => update(p.id, "url", e.target.value)}
                  placeholder={`Your ${p.label} link or username`}
                  style={{ width: "100%", fontSize: 15, padding: "10px 14px", border: "1px solid #E5E7EB", borderRadius: 10, outline: "none", background: "#FAFAFA", boxSizing: "border-box" }}
                />

                {/* Price input — only shown when locked */}
                {isLocked && (
                  <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
                    <Lock size={13} color="#DC2626" />
                    <span style={{ fontSize: 13, color: "#6B7280" }}>Unlock price:</span>
                    <input
                      type="number"
                      min={1}
                      max={9999}
                      value={cfg.price_coins || ""}
                      onChange={e => update(p.id, "price_coins", parseInt(e.target.value) || 0)}
                      placeholder="50"
                      style={{ width: 80, fontSize: 15, padding: "6px 10px", border: "1px solid #FECACA", borderRadius: 8, outline: "none", background: "#FEF2F2", textAlign: "center" }}
                    />
                    <span style={{ fontSize: 13, color: "#DC2626", fontWeight: 700 }}>RC</span>
                    <span style={{ fontSize: 12, color: "#9CA3AF" }}>= ~€{((cfg.price_coins || 0) * 0.01).toFixed(2)}</span>
                  </div>
                )}

                {/* Locked preview */}
                {isLocked && cfg.price_coins > 0 && (
                  <div style={{ marginTop: 8, padding: "8px 12px", background: "#FFF7ED", borderRadius: 8, fontSize: 12, color: "#92400E" }}>
                    👁 Visitors will see: <strong>"{p.label} — Unlock for {cfg.price_coins} RC"</strong>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* How it works */}
        <div style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 12, padding: "14px 16px", marginBottom: 24 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 8 }}>💡 How locking works</p>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 4 }}>
            {[
              "Visitors see a locked button with your price in RedCoins",
              "They click → RedCoins deducted from their balance → link revealed",
              "You receive the RC directly to your wallet",
              "Each visitor only pays once per link",
            ].map(item => (
              <li key={item} style={{ fontSize: 12, color: "#6B7280", display: "flex", gap: 8 }}>
                <span style={{ color: "#DC2626" }}>✓</span>{item}
              </li>
            ))}
          </ul>
        </div>

        {/* Save button */}
        {error && <p style={{ fontSize: 13, color: "#DC2626", marginBottom: 10 }}>{error}</p>}
        <button
          onClick={save}
          disabled={saving}
          style={{
            width: "100%", padding: "14px", borderRadius: 12, border: "none", cursor: saving ? "not-allowed" : "pointer",
            background: saved ? "#16A34A" : "#DC2626", color: "#fff", fontSize: 15, fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? "Saving..." : saved ? "✓ Saved!" : <><Save size={16} /> Save social links</>}
        </button>
      </div>
    </DashboardLayout>
  )
}
