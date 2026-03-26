"use client"

import { useEffect, useState } from "react"
import DashboardLayout from "@/components/DashboardLayout"

interface Earnings {
  total_earned: number
  available_for_payout: number
  next_payout_date: string
  bookings_count: number
  marketplace_count: number
}

export default function EarningsPage() {
  const [data, setData] = useState<Earnings | null>(null)
  const [loading, setLoading] = useState(true)
  const [requesting, setRequesting] = useState(false)

  useEffect(() => {
    fetch("/api/earnings")
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false))
  }, [])

  const today = new Date()
  const isPayoutDay = today.getDate() === 1 || today.getDate() === 14
  const canPayout = isPayoutDay && (data?.available_for_payout ?? 0) >= 500

  async function requestPayout() {
    setRequesting(true)
    // placeholder — payout request endpoint can be added later
    alert("Payout request submitted. You will receive payment within 48 hours.")
    setRequesting(false)
  }

  if (loading) {
    return (
      <DashboardLayout>
        <p style={{ color: "#999", fontSize: 14 }}>Loading earnings...</p>
      </DashboardLayout>
    )
  }

  if (!data) {
    return (
      <DashboardLayout>
        <p style={{ color: "#DC2626", fontSize: 14 }}>Failed to load earnings</p>
      </DashboardLayout>
    )
  }

  const dkk = (data.total_earned / 10).toFixed(2)

  return (
    <DashboardLayout>
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#111", marginBottom: 4 }}>
          Earnings
        </h1>
        <p style={{ fontSize: 14, color: "#999", marginBottom: 24 }}>
          Track your RedCoins income
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
            marginBottom: 24,
          }}
        >
          <div style={{ background: "#fff", border: "1px solid #E5E5E5", padding: 20 }}>
            <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 4 }}>Total earned</p>
            <p style={{ fontSize: 28, fontWeight: 700, color: "#111" }}>
              {data.total_earned} RC
            </p>
            <p style={{ fontSize: 12, color: "#999" }}>= {dkk} DKK</p>
          </div>

          <div style={{ background: "#fff", border: "1px solid #E5E5E5", padding: 20 }}>
            <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 4 }}>Available for payout</p>
            <p style={{ fontSize: 28, fontWeight: 700, color: "#111" }}>
              {data.available_for_payout} RC
            </p>
          </div>

          <div style={{ background: "#fff", border: "1px solid #E5E5E5", padding: 20 }}>
            <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 4 }}>Bookings completed</p>
            <p style={{ fontSize: 28, fontWeight: 700, color: "#111" }}>
              {data.bookings_count}
            </p>
          </div>

          <div style={{ background: "#fff", border: "1px solid #E5E5E5", padding: 20 }}>
            <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 4 }}>Marketplace sales</p>
            <p style={{ fontSize: 28, fontWeight: 700, color: "#111" }}>
              {data.marketplace_count}
            </p>
          </div>
        </div>

        <div
          style={{
            background: "#fff",
            border: "1px solid #E5E5E5",
            padding: 20,
            marginBottom: 24,
          }}
        >
          <p style={{ fontSize: 15, fontWeight: 600, color: "#111", marginBottom: 8 }}>
            Payout schedule
          </p>
          <p style={{ fontSize: 13, color: "#6B7280", marginBottom: 4 }}>
            Next payout: <strong>{data.next_payout_date}</strong>
          </p>
          <p style={{ fontSize: 12, color: "#999", marginBottom: 4 }}>
            Payout days: 1st and 14th of each month
          </p>
          <p style={{ fontSize: 12, color: "#999" }}>
            Minimum payout: 500 RedCoins
          </p>
        </div>

        {canPayout ? (
          <button
            onClick={requestPayout}
            disabled={requesting}
            style={{
              width: "100%",
              background: "#DC2626",
              color: "#fff",
              fontSize: 14,
              fontWeight: 600,
              padding: "12px 0",
              border: "none",
              borderRadius: 0,
              cursor: requesting ? "wait" : "pointer",
              opacity: requesting ? 0.6 : 1,
            }}
          >
            {requesting ? "Requesting..." : "Request Payout"}
          </button>
        ) : (
          <button
            disabled
            style={{
              width: "100%",
              background: "#E5E5E5",
              color: "#999",
              fontSize: 14,
              fontWeight: 600,
              padding: "12px 0",
              border: "none",
              borderRadius: 0,
              cursor: "not-allowed",
            }}
          >
            Available on {data.next_payout_date}
          </button>
        )}
      </div>
    </DashboardLayout>
  )
}
