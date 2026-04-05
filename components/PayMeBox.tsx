"use client"
import { useState, useEffect, useRef } from "react"
import { CreditCard, Banknote, Coins, Zap, Bitcoin } from "lucide-react"

const COIN_FACE_VALUE_EUR = 0.10

const METHOD_CONFIG = {
  revolut:  { label: "Revolut",   icon: CreditCard, color: "#6366F1" },
  cash:     { label: "Cash",      icon: Banknote,   color: "#10B981" },
  redcoins: { label: "Red Coins", icon: Coins,      color: "#DC2626" },
  crypto:   { label: "Crypto",    icon: Zap,        color: "#F59E0B" },
}

const CURRENCIES = [
  { code: "EUR", symbol: "€",  fi: "eu" },
  { code: "USD", symbol: "$",  fi: "us" },
  { code: "DKK", symbol: "kr", fi: "dk" },
  { code: "GBP", symbol: "£",  fi: "gb" },
  { code: "THB", symbol: "฿",  fi: "th" },
  { code: "NOK", symbol: "kr", fi: "no" },
]

function FlagImg({ fi }: { fi: string }) {
  return (
    <span
      className={`fi fi-${fi}`}
      style={{ width: 18, height: 14, display: "inline-block", flexShrink: 0, borderRadius: 2 }}
    />
  )
}

type PayTab = "redcoins" | "crypto" | "card"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function PayMeBox({ listing, providerUserId }: { listing: any, providerUserId: string }) {
  const [showModal, setShowModal] = useState(false)
  const [payTab, setPayTab] = useState<PayTab>("redcoins")
  const [amount, setAmount] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const [rates, setRates] = useState<Record<string, number> | null>(null)
  const [ratesLoading, setRatesLoading] = useState(false)
  const fetchedRef = useRef(false)

  useEffect(() => {
    if (!showModal || fetchedRef.current) return
    fetchedRef.current = true
    setRatesLoading(true)
    fetch("https://open.er-api.com/v6/latest/EUR")
      .then(r => r.json())
      .then(data => { if (data?.rates) setRates(data.rates) })
      .catch(() => setRates({ EUR: 1, USD: 1.08, DKK: 7.46, GBP: 0.86, THB: 39.5, NOK: 11.7 }))
      .finally(() => setRatesLoading(false))
  }, [showModal])

  const coins = parseInt(amount) || 0
  const eurValue = coins * COIN_FACE_VALUE_EUR

  const handleSendCoins = async () => {
    if (coins < 10) { setError("Minimum 10 Red Coins"); return }
    setLoading(true); setError("")
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

  const handleCryptoPay = async () => {
    if (coins < 10) { setError("Minimum 10 Red Coins"); return }
    setLoading(true); setError("")
    // Opret NOWPayments checkout for beløbet i EUR
    const res = await fetch("/api/coins/crypto-checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        packageId: "custom_tip",
        customAmount: eurValue,
        listingId: listing.id,
        toUserId: providerUserId,
        type: "tip",
      }),
    })
    const data = await res.json()
    if (data.url) {
      window.location.href = data.url
    } else {
      setError(data.error || "Could not initiate payment")
    }
    setLoading(false)
  }

  const paymentMethods = (listing.payment_methods as string[]) || []

  const PAY_TABS = [
    { id: "redcoins" as PayTab, label: "Red Coins", icon: <Coins size={13} /> },
    { id: "crypto"   as PayTab, label: "Crypto",    icon: <Bitcoin size={13} /> },
    { id: "card"     as PayTab, label: "Card",      icon: <CreditCard size={13} /> },
  ]

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
              <div key={method} style={{ display: "flex", alignItems: "center", gap: 5, background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 8, padding: "5px 10px", fontSize: 12, fontWeight: 600, color: "#374151" }}>
                <Icon size={13} color={config.color} />
                {config.label}
              </div>
            )
          })}
        </div>
        {paymentMethods.includes("redcoins") && (
          <button onClick={() => setShowModal(true)} style={{ width: "100%", padding: "10px 0", borderRadius: 10, background: "#DC2626", color: "#fff", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <Coins size={14} /> Send Red Coins
          </button>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }} onClick={() => setShowModal(false)}>
          <div style={{ background: "#fff", borderRadius: 20, padding: "26px 22px", width: "100%", maxWidth: 390, boxShadow: "0 24px 80px rgba(0,0,0,0.25)" }} onClick={e => e.stopPropagation()}>

            {success ? (
              <div style={{ textAlign: "center", padding: "24px 0" }}>
                <div style={{ fontSize: 48, color: "#10B981", marginBottom: 12 }}>✓</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#111", marginBottom: 6 }}>Sent!</div>
                <div style={{ fontSize: 13, color: "#6B7280" }}>{coins} Red Coins delivered</div>
              </div>
            ) : (
              <>
                <div style={{ fontSize: 17, fontWeight: 800, color: "#111", marginBottom: 2 }}>Send Payment</div>
                <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 18 }}>to {listing.name || listing.title}</div>

                {/* Payment method tabs */}
                <div style={{ display: "flex", gap: 6, marginBottom: 18, background: "#F3F4F6", borderRadius: 10, padding: 4 }}>
                  {PAY_TABS.map(tab => (
                    <button key={tab.id} onClick={() => { setPayTab(tab.id); setError("") }} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "8px 0", borderRadius: 7, fontSize: 12, fontWeight: 700, border: "none", cursor: "pointer", background: payTab === tab.id ? "#fff" : "transparent", color: payTab === tab.id ? "#111" : "#9CA3AF", boxShadow: payTab === tab.id ? "0 1px 4px rgba(0,0,0,0.1)" : "none", transition: "all 0.15s" }}>
                      {tab.icon} {tab.label}
                    </button>
                  ))}
                </div>

                {/* Amount */}
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
                  {payTab === "redcoins" ? "Amount (Red Coins)" : "Amount (Red Coins equivalent)"}
                </label>
                <input
                  type="number" min="10" value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="e.g. 100"
                  style={{ width: "100%", padding: "12px 14px", border: "2px solid #E5E7EB", borderRadius: 10, fontSize: 18, fontWeight: 700, marginBottom: 12, boxSizing: "border-box", outline: "none" }}
                  onFocus={e => e.target.style.borderColor = "#DC2626"}
                  onBlur={e => e.target.style.borderColor = "#E5E7EB"}
                />

                {/* Live valutaomregner */}
                {coins >= 1 && (
                  <div style={{ background: "#F8FAFC", border: "1px solid #E5E7EB", borderRadius: 12, padding: "12px 14px", marginBottom: 14 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                      {ratesLoading ? "Loading rates..." : "≈ Live value"}
                    </div>
                    {!ratesLoading && rates && (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "7px 16px" }}>
                        {CURRENCIES.map(({ code, symbol, fi }) => {
                          const rate = rates[code] ?? 1
                          const value = eurValue * rate
                          return (
                            <div key={code} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                              <FlagImg fi={fi} />
                              <span style={{ fontSize: 13, fontWeight: 700, color: "#111" }}>
                                {symbol}{value < 10 ? value.toFixed(2) : value.toFixed(0)}
                              </span>
                              <span style={{ fontSize: 10, color: "#9CA3AF" }}>{code}</span>
                            </div>
                          )
                        })}
                      </div>
                    )}
                    <div style={{ fontSize: 10, color: "#D1D5DB", marginTop: 8 }}>1 RC = €{COIN_FACE_VALUE_EUR.toFixed(2)} · live rates</div>
                  </div>
                )}

                {/* Card tab info */}
                {payTab === "card" && (
                  <div style={{ background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: 10, padding: "10px 14px", marginBottom: 14, fontSize: 12, color: "#92400E" }}>
                    Card payments coming soon — use Crypto or Red Coins for now.
                  </div>
                )}

                {/* Message (kun for redcoins) */}
                {payTab === "redcoins" && (
                  <>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Message (optional)</label>
                    <input type="text" value={message} onChange={e => setMessage(e.target.value)} placeholder="Add a message..." style={{ width: "100%", padding: "10px 14px", border: "1px solid #E5E7EB", borderRadius: 10, fontSize: 14, marginBottom: 14, boxSizing: "border-box" }} />
                  </>
                )}

                {error && (
                  <div style={{ color: "#DC2626", fontSize: 12, marginBottom: 12, padding: "8px 12px", background: "#FEF2F2", borderRadius: 8 }}>{error}</div>
                )}

                {/* Send knap */}
                <button
                  onClick={payTab === "redcoins" ? handleSendCoins : payTab === "crypto" ? handleCryptoPay : undefined}
                  disabled={loading || coins < 10 || payTab === "card"}
                  style={{ width: "100%", padding: "13px 0", borderRadius: 12, background: coins >= 10 && !loading && payTab !== "card" ? "#DC2626" : "#E5E7EB", color: coins >= 10 && !loading && payTab !== "card" ? "#fff" : "#9CA3AF", border: "none", fontSize: 15, fontWeight: 700, cursor: coins >= 10 && !loading && payTab !== "card" ? "pointer" : "not-allowed", transition: "all 0.15s" }}>
                  {loading ? "Processing..." :
                   payTab === "card" ? "Coming soon" :
                   coins < 10 ? "Enter amount (min. 10 RC)" :
                   payTab === "redcoins" ? `Send ${coins} Red Coins` :
                   `Pay €${eurValue.toFixed(2)} via Crypto`}
                </button>

                <button onClick={() => setShowModal(false)} style={{ width: "100%", padding: "10px 0", marginTop: 8, background: "none", border: "none", color: "#9CA3AF", fontSize: 13, cursor: "pointer" }}>
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
