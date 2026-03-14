"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase"
import AdminLayout from "@/components/AdminLayout"
import { COIN_SELL_RATE } from "@/lib/coinPackages"

interface PayoutRequest {
  id: string
  seller_id: string
  coins_amount: number
  usd_amount: number
  iban: string
  status: string
  created_at: string
  profiles?: { email: string; username: string | null }[] | { email: string; username: string | null } | null
}

type FilterStatus = "pending" | "approved" | "paid" | "rejected" | "all"

export default function AdminUdbetalingerPage() {
  const [requests, setRequests] = useState<PayoutRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterStatus>("pending")
  const [processingId, setProcessingId] = useState<string | null>(null)

  const fetchRequests = async (status: FilterStatus) => {
    setLoading(true)
    const supabase = createClient()
    let query = supabase
      .from("payout_requests")
      .select("id, seller_id, coins_amount, usd_amount, iban, status, created_at, profiles(email, username)")
      .order("created_at", { ascending: false })

    if (status !== "all") query = query.eq("status", status)

    const { data } = await query
    setRequests(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchRequests(filter) }, [filter])

  const updateStatus = async (id: string, newStatus: string, sellerId?: string, coinsAmount?: number) => {
    setProcessingId(id)
    const supabase = createClient()
    await supabase.from("payout_requests").update({ status: newStatus }).eq("id", id)

    // If marking as paid, deduct coins from seller wallet + log transaction
    if (newStatus === "paid" && sellerId && coinsAmount) {
      const { data: wallet } = await supabase.from("wallets").select("balance").eq("user_id", sellerId).maybeSingle()
      if (wallet) {
        await supabase.from("wallets").update({ balance: Math.max(0, wallet.balance - coinsAmount) }).eq("user_id", sellerId)
      }
      await supabase.from("coin_transactions").insert({
        user_id: sellerId,
        type: "payout",
        amount: -coinsAmount,
        note: `Udbetaling godkendt: ${coinsAmount} coins = $${(coinsAmount * COIN_SELL_RATE).toFixed(2)}`,
      })
    }

    setRequests(prev => prev.filter(r => r.id !== id))
    setProcessingId(null)
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case "pending": return <span className="bg-amber-50 text-amber-700 text-xs font-medium px-2.5 py-1 rounded-full">Afventer</span>
      case "approved": return <span className="bg-blue-50 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-full">Godkendt</span>
      case "paid": return <span className="bg-green-50 text-green-700 text-xs font-medium px-2.5 py-1 rounded-full">Betalt</span>
      case "rejected": return <span className="bg-red-50 text-red-700 text-xs font-medium px-2.5 py-1 rounded-full">Afvist</span>
      default: return <span className="text-xs text-gray-500">{status}</span>
    }
  }

  const tabs: { label: string; value: FilterStatus; }[] = [
    { label: "Afventer", value: "pending" },
    { label: "Godkendt", value: "approved" },
    { label: "Betalt", value: "paid" },
    { label: "Afvist", value: "rejected" },
    { label: "Alle", value: "all" },
  ]

  const totalPending = requests.filter(r => r.status === "pending").length
  const totalUsd = requests.filter(r => r.status === "pending").reduce((s, r) => s + Number(r.usd_amount), 0)

  return (
    <AdminLayout>
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Udbetalinger</h1>
          <p className="text-gray-500 text-sm mt-1">Administrer sælgers udbetalingsanmodninger</p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs text-gray-400 mb-1">Afventer</p>
            <p className="text-2xl font-black text-amber-500">{totalPending}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs text-gray-400 mb-1">Samlet USD (pending)</p>
            <p className="text-2xl font-black text-gray-900">${totalUsd.toFixed(2)}</p>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 mb-5 overflow-x-auto [&::-webkit-scrollbar]:hidden">
          {tabs.map(tab => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filter === tab.value
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : requests.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
            <p className="text-4xl mb-3">🏦</p>
            <p className="text-gray-500">Ingen udbetalingsanmodninger</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-left">
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Sælger</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Coins</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">USD</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">IBAN</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Dato</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                    <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Handling</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {requests.map(r => (
                    <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4">
                        <p className="font-medium text-gray-900">{(r.profiles as { email: string; username: string | null } | null)?.username || "—"}</p>
                        <p className="text-xs text-gray-400">{(r.profiles as { email: string; username: string | null } | null)?.email || r.seller_id.slice(0, 8) + "..."}</p>
                      </td>
                      <td className="px-5 py-4 font-bold text-red-500">🔴 {r.coins_amount}</td>
                      <td className="px-5 py-4 font-semibold text-gray-900">${Number(r.usd_amount).toFixed(2)}</td>
                      <td className="px-5 py-4 font-mono text-xs text-gray-600">{r.iban}</td>
                      <td className="px-5 py-4 text-gray-500 text-xs">{new Date(r.created_at).toLocaleDateString("da-DK")}</td>
                      <td className="px-5 py-4">{statusBadge(r.status)}</td>
                      <td className="px-5 py-4">
                        <div className="flex gap-2">
                          {r.status === "pending" && (
                            <>
                              <button
                                onClick={() => updateStatus(r.id, "paid", r.seller_id, r.coins_amount)}
                                disabled={processingId === r.id}
                                className="bg-green-500 hover:bg-green-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg disabled:opacity-50"
                              >
                                {processingId === r.id ? "..." : "✅ Betalt"}
                              </button>
                              <button
                                onClick={() => updateStatus(r.id, "rejected")}
                                disabled={processingId === r.id}
                                className="bg-red-100 hover:bg-red-200 text-red-700 text-xs font-semibold px-3 py-1.5 rounded-lg disabled:opacity-50"
                              >
                                ❌ Afvis
                              </button>
                            </>
                          )}
                          {r.status === "approved" && (
                            <button
                              onClick={() => updateStatus(r.id, "paid", r.seller_id, r.coins_amount)}
                              disabled={processingId === r.id}
                              className="bg-green-500 hover:bg-green-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg disabled:opacity-50"
                            >
                              {processingId === r.id ? "..." : "✅ Marker betalt"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {requests.map(r => (
                <div key={r.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-gray-900">{(r.profiles as { email: string; username: string | null } | null)?.username || "—"}</p>
                      <p className="text-xs text-gray-400">{(r.profiles as { email: string; username: string | null } | null)?.email}</p>
                    </div>
                    {statusBadge(r.status)}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                    <div>
                      <p className="text-xs text-gray-400">Coins</p>
                      <p className="font-bold text-red-500">🔴 {r.coins_amount}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">USD</p>
                      <p className="font-semibold text-gray-900">${Number(r.usd_amount).toFixed(2)}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-gray-400">IBAN</p>
                      <p className="font-mono text-xs text-gray-700">{r.iban}</p>
                    </div>
                  </div>
                  {r.status === "pending" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateStatus(r.id, "paid", r.seller_id, r.coins_amount)}
                        disabled={processingId === r.id}
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold py-2 rounded-xl disabled:opacity-50"
                      >
                        ✅ Betalt
                      </button>
                      <button
                        onClick={() => updateStatus(r.id, "rejected")}
                        disabled={processingId === r.id}
                        className="flex-1 bg-red-100 text-red-700 text-sm font-semibold py-2 rounded-xl disabled:opacity-50"
                      >
                        ❌ Afvis
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  )
}
