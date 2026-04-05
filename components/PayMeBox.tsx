"use client"
import { useState } from "react"
import { CreditCard, Banknote, Coins, Zap, Send } from "lucide-react"

const METHOD_CONFIG = {
  revolut:  { label: "Revolut",   icon: CreditCard, color: "#6366F1" },
  cash:     { label: "Cash",      icon: Banknote,   color: "#10B981" },
  redcoins: { label: "RedCoins",  icon: Coins,      color: "#DC2626" },
  crypto:   { label: "Crypto",    icon: Zap,        color: "#F59E0B" },
}

export default function PayMeBox({ listing, providerUserId }: { listing: any, providerUserId: string }) {
  const [showModal, setShowModal] = useState(false)
  const [amount, setAmount] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  const handleSend = async () => {
    const coins = parseInt(amount)
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
      setTimeout(() => { setShowModal(false); setSuccess(false); setAmount(""); setMessage("") }, 2000)
    } else {
      setError(data.error || "Something went wrong")
    }
    setLoading(false)
  }

  return (
    <>
      {/* Pay Me kort */}
      <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: "16px 18px", marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#111", marginBottom: 12 }}>Pay Me</div>

        {/* Betalingsmetode badges */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
          {listing.payment_methods.map((method: string) => {
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

        {/* Send RedCoins knap */}
        {listing.payment_methods.includes("redcoins") && (
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
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1000, padding: 20,
        }} onClick={() => setShowModal(false)}>
          <div style={{
            background: "#fff", borderRadius: 16, padding: 28, width: "100%", maxWidth: 360,
            boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
          }} onClick={e => e.stopPropagation()}>
            {success ? (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>&#10003;</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "#111" }}>Sent!</div>
              </div>
            ) : (
              <>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#111", marginBottom: 4 }}>Send Red Coins</div>
                <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 20 }}>to {listing.name || listing.title}</div>

                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Amount (Red Coins)</label>
                <input
                  type="number" min="10" value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="e.g. 50"
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 14, marginBottom: 12, boxSizing: "border-box" }}
                />

                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>Message (optional)</label>
                <input
                  type="text" value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Add a message..."
                  style={{ width: "100%", padding: "10px 12px", border: "1px solid #E5E7EB", borderRadius: 8, fontSize: 14, marginBottom: 16, boxSizing: "border-box" }}
                />

                {error && <div style={{ color: "#DC2626", fontSize: 12, marginBottom: 12 }}>{error}</div>}

                <button
                  onClick={handleSend} disabled={loading}
                  style={{
                    width: "100%", padding: "12px 0", borderRadius: 10,
                    background: loading ? "#9CA3AF" : "#DC2626", color: "#fff",
                    border: "none", fontSize: 14, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
                  }}
                >
                  {loading ? "Sending..." : `Send ${amount || "?"} Red Coins`}
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
