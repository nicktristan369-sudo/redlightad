"use client"
import { useState, useEffect, useRef } from "react"
import { CreditCard, Banknote, Coins, Zap } from "lucide-react"

const COIN_FACE_VALUE_EUR = 0.10 // 1 RC = €0.10

const METHOD_CONFIG = {
  revolut:  { label: "Revolut",   icon: CreditCard, color: "#6366F1" },
  cash:     { label: "Cash",      icon: Banknote,   color: "#10B981" },
  redcoins: { label: "Red Coins", icon: Coins,      color: "#DC2626" },
  crypto:   { label: "Crypto",    icon: Zap,        color: "#F59E0B" },
}

// Valutaer der vises i omregneren
const DISPLAY_CURRENCIES = [
  { code: "EUR", symbol: "€",  flag: "🇪🇺" },
  { code: "USD", symbol: "$",  flag: "🇺🇸" },
  { code: "DKK", symbol: "kr", flag: "🇩🇰" },
  { code: "GBP", symbol: "£",  flag: "🇬🇧" },
  { code: "THB", symbol: "฿",  flag: "🇹🇭" },
  { code: "NOK", symbol: "kr", flag: "🇳🇴" },
]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function PayMeBox({ listing, providerUserId }: { listing: any, providerUserId: string }) {
  const [showModal, setShowModal] = useState(false)
  const [amount, setAmount] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  // Valuta state
  const [rates, setRates] = useState<Record<string, number> | null>(null)
  const [ratesLoading, setRatesLoading] = useState(false)
  const fetchedRef = useRef(false)

  // Hent live kurser når modal åbnes
  useEffect(() => {
    if (!showModal || fetchedRef.current) return
    fetchedRef.current = true
    setRatesLoading(true)
    fetch("https://open.er-api.com/v6/latest/EUR")
      .then(r => r.json())
      .then(data => {
        if (data?.rates) setRates(data.rates)
      })
      .catch(() => {
        // Fallback kurser hvis API fejler
        setRates({ EUR: 1, USD: 1.08, DKK: 7.46, GBP: 0.86, THB: 39.5, NOK: 11.7 })
      })
      .finally(() => setRatesLoading(false))
  }, [showModal])

  const coins = parseInt(amount) || 0
  const eurValue = coins * COIN_FACE_VALUE_EUR

  const handleSend = async () => {
    if (!coins || coins < 10) { setError("Minimum 10 Red Coins"); return }
    setLoading(true)
    setError("")
    const res = await fetch("/api/tips/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId: listing.id, toUserId: providerUserId, amount: coins, message }),
    })
    const data = await res.json()
    if (res.ok) {
      setSuccess(true)
      setTimeout(() => { setShowModal(false); setSuccess(false); setAmount(""); setMessage("") }, 2500)
    } else {
      setError(data.error || "Something went wrong")
    }
    setLoading(false)
  }

  const paymentMethods = (listing.payment_methods as string[]) || []

  return (
    <>
      {/* Pay Me kort */}
      <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: "16px 18px", marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#111", marginBottom: 12 }}>Pay Me</div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: paymentMethods.includes("redcoins") ? 14 : 0 }}>
          {paymentMethods.map((method: string) => {
            const config = METHOD_CONFIG[method as keyof typeof METHOD_CONFIG]
            if (!config) return null
            const Icon = config.icon
            return (
              <div key={method} style={{
                display: "flex", alignItems: "center", gap: 5,
                background: "#F9FAFB", border: "1px solid #E5E7EB",
                borderRadius: 8, padding: "5px 10px",
                fontSize: 12, fontWeight: 600, color: "#374151",
              }}>
                <Icon size={13} color={config.color} />
                {config.label}
              </div>
            )
          })}
        </div>

        {paymentMethods.includes("redcoins") && (
          <button
            onClick={() => setShowModal(true)}
            style={{
              width: "100%", padding: "10px 0", borderRadius: 10,
              background: "#DC2626", color: "#fff", border: "none",
              fontSize: 13, fontWeight: 700, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >
            <Coins size={14} />
            Send Red Coins
          </button>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1000, padding: 20,
        }} onClick={() => setShowModal(false)}>
          <div style={{
            background: "#fff", borderRadius: 20, padding: "28px 24px", width: "100%", maxWidth: 380,
            boxShadow: "0 24px 80px rgba(0,0,0,0.25)",
          }} onClick={e => e.stopPropagation()}>

            {success ? (
              <div style={{ textAlign: "center", padding: "24px 0" }}>
                <div style={{ fontSize: 48, marginBottom: 14, color: "#10B981" }}>✓</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#111", marginBottom: 6 }}>Sent!</div>
                <div style={{ fontSize: 13, color: "#6B7280" }}>{coins} Red Coins delivered</div>
              </div>
            ) : (
              <>
                <div style={{ fontSize: 17, fontWeight: 800, color: "#111", marginBottom: 3 }}>Send Red Coins</div>
                <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 20 }}>to {String(listing.name || listing.title || "")}</div>

                {/* Amount input */}
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Amount (Red Coins)</label>
                <input
                  type="number" min="10" value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="e.g. 100"
                  style={{
                    width: "100%", padding: "12px 14px", border: "2px solid #E5E7EB",
                    borderRadius: 10, fontSize: 18, fontWeight: 700,
                    marginBottom: 12, boxSizing: "border-box", outline: "none",
                  }}
                  onFocus={e => e.target.style.borderColor = "#DC2626"}
                  onBlur={e => e.target.style.borderColor = "#E5E7EB"}
                />

                {/* Live valuta omregner */}
                {coins >= 1 && (
                  <div style={{
                    background: "#F8FAFC", border: "1px solid #E5E7EB",
                    borderRadius: 12, padding: "12px 14px", marginBottom: 14,
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
                      {ratesLoading ? "Loading live rates..." : "≈ Live value"}
                    </div>
                    {!ratesLoading && rates && (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 12px" }}>
                        {DISPLAY_CURRENCIES.map(({ code, symbol, flag }) => {
                          const rate = rates[code] ?? 1
                          const value = eurValue * rate
                          const formatted = value < 10
                            ? value.toFixed(2)
                            : value.toFixed(0)
                          return (
                            <div key={code} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{ fontSize: 14 }}>{flag}</span>
                              <div>
                                <span style={{ fontSize: 13, fontWeight: 700, color: "#111" }}>
                                  {symbol}{formatted}
                                </span>
                                <span style={{ fontSize: 11, color: "#9CA3AF", marginLeft: 3 }}>{code}</span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                    <div style={{ fontSize: 10, color: "#D1D5DB", marginTop: 8 }}>
                      1 RC = €{COIN_FACE_VALUE_EUR.toFixed(2)} · rates updated live
                    </div>
                  </div>
                )}

                {/* Message */}
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Message (optional)</label>
                <input
                  type="text" value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Add a message..."
                  style={{
                    width: "100%", padding: "10px 14px", border: "1px solid #E5E7EB",
                    borderRadius: 10, fontSize: 14, marginBottom: 16, boxSizing: "border-box",
                  }}
                />

                {error && (
                  <div style={{ color: "#DC2626", fontSize: 12, marginBottom: 12, padding: "8px 12px", background: "#FEF2F2", borderRadius: 8 }}>
                    {error}
                  </div>
                )}

                <button
                  onClick={handleSend} disabled={loading || coins < 10}
                  style={{
                    width: "100%", padding: "13px 0", borderRadius: 12,
                    background: coins >= 10 && !loading ? "#DC2626" : "#E5E7EB",
                    color: coins >= 10 && !loading ? "#fff" : "#9CA3AF",
                    border: "none", fontSize: 15, fontWeight: 700,
                    cursor: coins >= 10 && !loading ? "pointer" : "not-allowed",
                    transition: "all 0.15s",
                  }}
                >
                  {loading ? "Sending..." : coins >= 10 ? `Send ${coins} Red Coins` : "Enter amount (min. 10)"}
                </button>

                <button onClick={() => setShowModal(false)} style={{
                  width: "100%", padding: "10px 0", marginTop: 8,
                  background: "none", border: "none", color: "#9CA3AF", fontSize: 13, cursor: "pointer",
                }}>
                  Cancel
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
