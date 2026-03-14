"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase"
import AdminLayout from "@/components/AdminLayout"

interface PendingListing {
  id: string
  title: string
  created_at: string
  user_id: string
}

interface Stats {
  totalListings: number
  activeListings: number
  pendingListings: number
  totalUsers: number
  monthlyRevenue: number
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalListings: 0,
    activeListings: 0,
    pendingListings: 0,
    totalUsers: 0,
    monthlyRevenue: 0,
  })
  const [pendingListings, setPendingListings] = useState<PendingListing[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      const supabase = createClient()

      const [allListings, activeListings, pendingListingsRes, profiles, orders] =
        await Promise.all([
          supabase.from("listings").select("id", { count: "exact", head: true }),
          supabase
            .from("listings")
            .select("id", { count: "exact", head: true })
            .eq("status", "active"),
          supabase
            .from("listings")
            .select("id, title, created_at, user_id")
            .eq("status", "pending")
            .order("created_at", { ascending: false })
            .limit(10),
          supabase.from("profiles").select("id", { count: "exact", head: true }),
          supabase
            .from("orders")
            .select("amount")
            .eq("status", "paid")
            .gte(
              "created_at",
              new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
            ),
        ])

      const revenue = (orders.data || []).reduce((sum, o) => sum + (o.amount || 0), 0)

      setStats({
        totalListings: allListings.count || 0,
        activeListings: activeListings.count || 0,
        pendingListings: pendingListingsRes.data?.length || 0,
        totalUsers: profiles.count || 0,
        monthlyRevenue: revenue,
      })
      setPendingListings(pendingListingsRes.data || [])
    } catch (err) {
      console.error("Failed to fetch admin stats:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleAction = async (id: string, status: "active" | "rejected") => {
    setActionLoading(id)
    try {
      const supabase = createClient()
      await supabase.from("listings").update({ status }).eq("id", id)
      setPendingListings((prev) => prev.filter((l) => l.id !== id))
      setStats((prev) => ({
        ...prev,
        pendingListings: prev.pendingListings - 1,
        activeListings: status === "active" ? prev.activeListings + 1 : prev.activeListings,
      }))
    } catch (err) {
      console.error("Action failed:", err)
    } finally {
      setActionLoading(null)
    }
  }

  const statCards = [
    { label: "Annoncer i alt", value: stats.totalListings, icon: "\u{1F4CB}" },
    { label: "Aktive annoncer", value: stats.activeListings, icon: "\u2705" },
    { label: "Afventende godkendelse", value: stats.pendingListings, icon: "\u23F3" },
    { label: "Brugere i alt", value: stats.totalUsers, icon: "\u{1F465}" },
    {
      label: "M\u00E5nedlig oms\u00E6tning (kr)",
      value: (stats.monthlyRevenue / 100).toLocaleString("da-DK"),
      icon: "\u{1F4B0}",
    },
  ]

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
            {statCards.map((card) => (
              <div
                key={card.label}
                className="rounded-2xl bg-white p-5 shadow-sm border border-gray-100"
              >
                <div className="text-2xl mb-2">{card.icon}</div>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                <p className="text-sm text-gray-500 mt-1">{card.label}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl bg-white shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">
                Afventende annoncer
              </h2>
            </div>

            {pendingListings.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">
                Ingen afventende annoncer
              </div>
            ) : (
              <>
                {/* Mobile card view */}
                <div className="block md:hidden divide-y divide-gray-100">
                  {pendingListings.map((listing) => (
                    <div key={listing.id} className="p-4 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">{listing.title}</p>
                        <p className="text-xs text-gray-500">{new Date(listing.created_at).toLocaleDateString("da-DK")}</p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button onClick={() => handleAction(listing.id, "active")} disabled={actionLoading === listing.id} className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50">Godkend</button>
                        <button onClick={() => handleAction(listing.id, "rejected")} disabled={actionLoading === listing.id} className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50">Afvis</button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop table view */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 text-left text-gray-500">
                        <th className="px-6 py-3 font-medium">Titel</th>
                        <th className="px-6 py-3 font-medium">Oprettet</th>
                        <th className="px-6 py-3 font-medium text-right">Handlinger</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingListings.map((listing) => (
                        <tr
                          key={listing.id}
                          className="border-b border-gray-50 hover:bg-gray-50"
                        >
                          <td className="px-6 py-4 font-medium text-gray-900">
                            {listing.title}
                          </td>
                          <td className="px-6 py-4 text-gray-500">
                            {new Date(listing.created_at).toLocaleDateString("da-DK")}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleAction(listing.id, "active")}
                                disabled={actionLoading === listing.id}
                                className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                              >
                                Godkend
                              </button>
                              <button
                                onClick={() => handleAction(listing.id, "rejected")}
                                disabled={actionLoading === listing.id}
                                className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                              >
                                Afvis
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </AdminLayout>
  )
}
