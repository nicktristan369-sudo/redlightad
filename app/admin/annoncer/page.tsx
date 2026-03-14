"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase"
import AdminLayout from "@/components/AdminLayout"

interface Listing {
  id: string
  title: string
  category: string
  location: string
  status: string
  profile_image: string | null
  created_at: string
  user_id: string
  voice_message_url: string | null
}

type FilterTab = "alle" | "pending" | "active" | "rejected" | "draft"

export default function AdminAnnoncerPage() {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<FilterTab>("alle")
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchListings = async () => {
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from("listings")
        .select("id, title, category, location, status, profile_image, created_at, user_id, voice_message_url")
        .order("created_at", { ascending: false })

      setListings(data || [])
    } catch (err) {
      console.error("Failed to fetch listings:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchListings()
  }, [])

  const handleStatus = async (id: string, status: "active" | "rejected") => {
    setActionLoading(id)
    try {
      const supabase = createClient()
      await supabase.from("listings").update({ status }).eq("id", id)
      setListings((prev) =>
        prev.map((l) => (l.id === id ? { ...l, status } : l))
      )
    } catch (err) {
      console.error("Status update failed:", err)
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Er du sikker p\u00E5 at du vil slette denne annonce?")) return
    setActionLoading(id)
    try {
      const supabase = createClient()
      await supabase.from("listings").delete().eq("id", id)
      setListings((prev) => prev.filter((l) => l.id !== id))
    } catch (err) {
      console.error("Delete failed:", err)
    } finally {
      setActionLoading(null)
    }
  }

  const filtered =
    activeTab === "alle"
      ? listings
      : listings.filter((l) => l.status === activeTab)

  const counts = {
    alle: listings.length,
    pending: listings.filter((l) => l.status === "pending").length,
    active: listings.filter((l) => l.status === "active").length,
    rejected: listings.filter((l) => l.status === "rejected").length,
    draft: listings.filter((l) => l.status === "draft").length,
  }

  const tabs: { key: FilterTab; label: string }[] = [
    { key: "alle", label: "Alle" },
    { key: "pending", label: "Afventende" },
    { key: "active", label: "Aktive" },
    { key: "rejected", label: "Afviste" },
    { key: "draft", label: "Kladder" },
  ]

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-700",
      active: "bg-green-100 text-green-700",
      rejected: "bg-red-100 text-red-700",
      draft: "bg-gray-100 text-gray-600",
    }
    const labels: Record<string, string> = {
      pending: "Afventer",
      active: "Aktiv",
      rejected: "Afvist",
      draft: "Kladde",
    }
    return (
      <span
        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status] || "bg-gray-100 text-gray-600"}`}
      >
        {labels[status] || status}
      </span>
    )
  }

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Annoncer</h1>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="flex gap-2 mb-6 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pb-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? "bg-red-600 text-white"
                    : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                }`}
              >
                {tab.label} ({counts[tab.key]})
              </button>
            ))}
          </div>

          <div className="rounded-2xl bg-white shadow-sm border border-gray-100 overflow-hidden">
            {filtered.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">
                Ingen annoncer i denne kategori
              </div>
            ) : (
              <>
                {/* Mobile card view */}
                <div className="block md:hidden divide-y divide-gray-100">
                  {filtered.map((listing) => (
                    <div key={listing.id} className="p-4 space-y-3">
                      <div className="flex items-center gap-3">
                        {listing.profile_image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={listing.profile_image} alt="" className="w-10 h-10 rounded-lg object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-xs">N/A</div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="font-medium text-gray-900 truncate">{listing.title}</p>
                            {listing.voice_message_url && (
                              <span title="Har voice message" className="text-sm flex-shrink-0">🎙</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500">{listing.category} &middot; {listing.location}</p>
                        </div>
                        {statusBadge(listing.status)}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">{new Date(listing.created_at).toLocaleDateString("da-DK")}</span>
                        <div className="flex gap-1.5">
                          {listing.status !== "active" && (
                            <button onClick={() => handleStatus(listing.id, "active")} disabled={actionLoading === listing.id} className="rounded-lg bg-green-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50">Godkend</button>
                          )}
                          {listing.status !== "rejected" && (
                            <button onClick={() => handleStatus(listing.id, "rejected")} disabled={actionLoading === listing.id} className="rounded-lg bg-yellow-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-yellow-700 disabled:opacity-50">Afvis</button>
                          )}
                          <button onClick={() => handleDelete(listing.id)} disabled={actionLoading === listing.id} className="rounded-lg bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50">Slet</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop table view */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 text-left text-gray-500">
                        <th className="px-6 py-3 font-medium">Billede</th>
                        <th className="px-6 py-3 font-medium">Titel</th>
                        <th className="px-6 py-3 font-medium">Kategori</th>
                        <th className="px-6 py-3 font-medium">Lokation</th>
                        <th className="px-6 py-3 font-medium">Status</th>
                        <th className="px-6 py-3 font-medium">Oprettet</th>
                        <th className="px-6 py-3 font-medium text-right">Handlinger</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((listing) => (
                        <tr
                          key={listing.id}
                          className="border-b border-gray-50 hover:bg-gray-50"
                        >
                          <td className="px-6 py-4">
                            {listing.profile_image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={listing.profile_image}
                                alt=""
                                className="w-10 h-10 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
                                N/A
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 font-medium text-gray-900">
                            {listing.title}
                          </td>
                          <td className="px-6 py-4 text-gray-600">{listing.category}</td>
                          <td className="px-6 py-4 text-gray-600">{listing.location}</td>
                          <td className="px-6 py-4">{statusBadge(listing.status)}</td>
                          <td className="px-6 py-4 text-gray-500">
                            {new Date(listing.created_at).toLocaleDateString("da-DK")}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-1.5">
                              {listing.status !== "active" && (
                                <button
                                  onClick={() => handleStatus(listing.id, "active")}
                                  disabled={actionLoading === listing.id}
                                  className="rounded-lg bg-green-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                                >
                                  Godkend
                                </button>
                              )}
                              {listing.status !== "rejected" && (
                                <button
                                  onClick={() => handleStatus(listing.id, "rejected")}
                                  disabled={actionLoading === listing.id}
                                  className="rounded-lg bg-yellow-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-yellow-700 disabled:opacity-50"
                                >
                                  Afvis
                                </button>
                              )}
                              <button
                                onClick={() => handleDelete(listing.id)}
                                disabled={actionLoading === listing.id}
                                className="rounded-lg bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                              >
                                Slet
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
