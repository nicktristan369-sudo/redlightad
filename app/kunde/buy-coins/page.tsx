"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import KundeLayout from "@/components/KundeLayout"
import { COIN_PACKAGES } from "@/lib/coinPackages"

export default function KundeBuyCoinsPage() {
  const [balance, setBalance] = useState<number | null>(null)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.replace("/login"); return }
      const { data } = await supabase
        .from("customer_profiles")
        .select("redcoins")
        .eq("user_id", user.id)
        .single()
      if (data) setBalance(data.redcoins ?? 0)
    })
  }, [router])

  return (
    <KundeLayout>
      <div style={{ maxWidth: 680 }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#111", margin: "0 0 6px" }}>Red Coins</h1>
          <p style={{ fontSize: 14, color: "#6B7280", margin: "0 0 16px" }}>Den nemmeste made at betale pa RedLightAD</p>
          {balance !== null && (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#fff", border: "1px solid #E5E7EB", borderRadius: 999, padding: "8px 18px" }}>
              <span style={{ width: 18, height: 18, borderRadius: "50%", background: "#DC2626", display: "inline-block" }} />
              <span style={{ fontSize: 16, fontWeight: 700, color: "#111" }}>{balance.toLocaleString()}</span>
              <span style={{ fontSize: 13, color: "#6B7280" }}>Red Coins</span>
            </div>
          )}
        </div>

        {/* Package grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: 14, marginBottom: 28 }}>
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
                cursor: "pointer",
                transition: "box-shadow 0.15s",
              }}
              onClick={() => router.push("/dashboard/buy-coins")}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)")}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}
            >
              {pkg.popular && (
                <span style={{
                  position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)",
                  background: "#DC2626", color: "#fff", fontSize: 10, fontWeight: 700,
                  textTransform: "uppercase", letterSpacing: "0.05em", padding: "3px 10px", borderRadius: 999, whiteSpace: "nowrap",
                }}>
                  Mest Popular
                </span>
              )}
              <div style={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>{pkg.label}</div>
              <div style={{ fontSize: 32, fontWeight: 900, color: "#DC2626", marginBottom: 2 }}>{pkg.coins.toLocaleString()}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#6B7280", marginBottom: 14 }}>RedCoins</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#111", marginBottom: 4 }}>&euro;{pkg.price_eur}</div>
              <div style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 16 }}>&euro;{pkg.per_coin.toFixed(3)} per coin</div>
              <div style={{
                width: "100%", padding: "10px 0", borderRadius: 10, fontSize: 13, fontWeight: 700,
                background: pkg.popular ? "#DC2626" : "#111", color: "#fff", textAlign: "center",
              }}>
                Kob nu
              </div>
            </div>
          ))}
        </div>

        {/* Info */}
        <div style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 12, padding: "14px 18px", textAlign: "center", fontSize: 13, color: "#6B7280" }}>
          Diskret betaling — dit kob vises diskret pa dit kontoudtog.
        </div>
      </div>
    </KundeLayout>
  )
}
