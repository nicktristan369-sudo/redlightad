"use client"

import { useState } from "react"

interface Rate {
  duration: string
  price: string
}

export default function RatesWithRC({
  rates,
  listingId,
}: {
  rates: Rate[]
  listingId?: string
}) {
  const [loading, setLoading] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  const hasRates = rates.some((r) => {
    const num = parseFloat(r.price.replace(/[^0-9]/g, ""))
    return num > 0
  })

  async function handlePay(rate: Rate) {
    const priceKr = parseFloat(rate.price.replace(/[^0-9]/g, ""))
    if (!priceKr || !listingId) return

    setLoading(rate.duration)
    setMsg(null)

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listing_id: listingId,
          rate_type: rate.duration,
          price_kr: priceKr,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = "/login"
          return
        }
        if (data.error === "insufficient_coins") {
          setMsg("Not enough RedCoins. Buy more in your wallet.")
        } else {
          setMsg(data.error || "Something went wrong")
        }
      } else {
        setMsg("Booking confirmed!")
      }
    } catch {
      setMsg("Network error")
    } finally {
      setLoading(null)
    }
  }

  return (
    <div>
      {hasRates && (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: "#FEF2F2",
            color: "#DC2626",
            border: "1px solid #FECACA",
            fontSize: 11,
            fontWeight: 600,
            padding: "4px 10px",
            marginBottom: 12,
            letterSpacing: "0.02em",
          }}
        >
          <span>●</span> Accepts RedCoins
        </div>
      )}

      <div style={{ overflow: "hidden", borderRadius: 8 }}>
        {rates.map((rate, i) => {
          const priceKr = parseFloat(rate.price.replace(/[^0-9]/g, ""))
          const rc = priceKr > 0 ? priceKr * 10 : 0

          return (
            <div
              key={rate.duration}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 12px",
                background: i % 2 === 0 ? "#F9FAFB" : "#fff",
                gap: 8,
              }}
            >
              <span style={{ fontSize: 14, color: "#374151" }}>
                {rate.duration}
              </span>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span style={{ fontSize: 14, fontWeight: 700, color: "#DC2626" }}>
                  {rate.price}
                </span>
                {rc > 0 && (
                  <>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#DC2626",
                      }}
                    >
                      {rc} RC
                    </span>
                    <button
                      onClick={() => handlePay(rate)}
                      disabled={loading === rate.duration}
                      style={{
                        background: "#000",
                        color: "#fff",
                        fontSize: 10,
                        fontWeight: 600,
                        padding: "4px 10px",
                        border: "none",
                        borderRadius: 0,
                        cursor: loading === rate.duration ? "wait" : "pointer",
                        opacity: loading === rate.duration ? 0.6 : 1,
                      }}
                    >
                      {loading === rate.duration ? "..." : "Pay with RC"}
                    </button>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {msg && (
        <p
          style={{
            fontSize: 12,
            marginTop: 8,
            color: msg === "Booking confirmed!" ? "#16A34A" : "#DC2626",
            fontWeight: 600,
          }}
        >
          {msg}
        </p>
      )}

      <p style={{ fontSize: 11, color: "#999", marginTop: 8 }}>
        RedCoins = secure & anonymous payment
      </p>
    </div>
  )
}
