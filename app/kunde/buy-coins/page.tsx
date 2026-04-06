"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import KundeLayout from "@/components/KundeLayout"
import { COIN_PACKAGES } from "@/lib/coinPackages"
import { Lock, Zap, ShieldCheck } from "lucide-react"

export default function KundeBuyCoinsPage() {
  const [balance, setBalance] = useState<number | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.replace("/login"); return }
      setUserId(user.id)
      const { data } = await supabase
        .from("customer_profiles")
        .select("redcoins")
        .eq("user_id", user.id)
        .single()
      if (data) setBalance(data.redcoins ?? 0)
    })
  }, [router])

  const handleBuy = async (packageId: string) => {
    if (!userId) return
    setLoading(packageId)
    try {
      const res = await fetch("/api/coins/crypto-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId, userId }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert(data.error || "Payment error — please try again")
      }
    } catch {
      alert("Connection error — please try again")
    }
    setLoading(null)
  }

  return (
    <KundeLayout>
      <div style={{ maxWidth: 700 }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#111", margin: "0 0 6px" }}>Red Coins</h1>
          <p style={{ fontSize: 14, color: "#6B7280", margin: "0 0 16px" }}>The easiest way to pay on RedLightAD</p>
          {balance !== null && (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#fff", border: "1px solid #E5E7EB", borderRadius: 999, padding: "8px 18px" }}>
              <span style={{ width: 16, height: 16, borderRadius: "50%", background: "#DC2626", display: "inline-block" }} />
              <span style={{ fontSize: 16, fontWeight: 700, color: "#111" }}>{balance.toLocaleString()}</span>
              <span style={{ fontSize: 13, color: "#6B7280" }}>Red Coins</span>
            </div>
          )}
        </div>

        {/* Crypto info banner */}
        <div style={{ background: "#0F172A", borderRadius: 12, padding: "14px 18px", marginBottom: 24, display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <ShieldCheck size={18} color="#22D3EE" />
              <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>Anonymous Crypto Payment</span>
            </div>
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Lock size={12} color="#94A3B8" />
                <span style={{ fontSize: 12, color: "#94A3B8" }}>Discreet billing — no platform name</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Zap size={12} color="#94A3B8" />
                <span style={{ fontSize: 12, color: "#94A3B8" }}>BTC, ETH, USDC + 300 more</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <ShieldCheck size={12} color="#94A3B8" />
                <span style={{ fontSize: 12, color: "#94A3B8" }}>No personal info required</span>
              </div>
            </div>
          </div>
        </div>

        {/* Package grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 14, marginBottom: 24 }}>
          {COIN_PACKAGES.map((pkg) => (
            <div
              key={pkg.id}
              style={{
                position: "relative",
                background: "#fff",
                borderRadius: 14,
                border: pkg.popular ? "2px solid #DC2626" : "1px solid #E5E7EB",
                padding: "22px 18px",
                textAlign: "center",
                boxShadow: pkg.popular ? "0 0 0 4px rgba(220,38,38,0.07)" : "none",
              }}
            >
              {pkg.popular && (
                <span style={{
                  position: "absolute", top: -11, left: "50%", transform: "translateX(-50%)",
                  background: "#DC2626", color: "#fff", fontSize: 10, fontWeight: 700,
                  textTransform: "uppercase", letterSpacing: "0.06em",
                  padding: "3px 12px", borderRadius: 999, whiteSpace: "nowrap",
                }}>
                  Most Popular
                </span>
              )}
              <div style={{ fontSize: 12, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>{pkg.label}</div>
              <div style={{ fontSize: 34, fontWeight: 900, color: "#DC2626", lineHeight: 1, marginBottom: 2 }}>{pkg.coins.toLocaleString()}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#6B7280", marginBottom: 14 }}>RedCoins</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#111", marginBottom: 3 }}>€{pkg.price_eur}</div>
              <div style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 16 }}>€{pkg.per_coin.toFixed(3)} per coin</div>
              <button
                onClick={() => handleBuy(pkg.id)}
                disabled={loading === pkg.id}
                style={{
                  width: "100%", padding: "13px 0", borderRadius: 10, fontSize: 14, fontWeight: 700,
                  background: pkg.popular ? "#DC2626" : "#111", color: "#fff",
                  border: "none", cursor: loading === pkg.id ? "not-allowed" : "pointer",
                  opacity: loading === pkg.id ? 0.7 : 1,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                }}
              >
                {loading === pkg.id ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ animation: "spin 0.8s linear infinite" }}>
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3"/>
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                  </svg>
                ) : "Buy now"}
              </button>
            </div>
          ))}
        </div>

        {/* Footer notice */}
        <div style={{ background: "#F8FAFC", border: "1px solid #E5E7EB", borderRadius: 12, padding: "14px 18px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <Lock size={15} color="#6B7280" style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#374151", margin: "0 0 2px" }}>Discreet & Anonymous</p>
              <p style={{ fontSize: 12, color: "#9CA3AF", margin: 0, lineHeight: 1.5 }}>
                Your purchase is processed anonymously via crypto. No platform name appears on your statement. Red Coins never expire.
              </p>
            </div>
          </div>
        </div>

        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    </KundeLayout>
  )
}
