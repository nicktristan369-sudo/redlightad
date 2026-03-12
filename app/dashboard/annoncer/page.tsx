"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import DashboardLayout from "@/components/DashboardLayout"

interface Listing {
  id: string
  title: string
  category: string
  location: string
  status: string
  created_at: string
  profile_image: string | null
}

export default function MineAnnoncer() {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchListings = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace("/login"); return }

      const { data } = await supabase
        .from("listings")
        .select("id, title, category, location, status, created_at, profile_image")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      setListings(data || [])
      setLoading(false)
    }
    fetchListings()
  }, [router])

  const handleDelete = async (id: string) => {
    if (!confirm("Er du sikker på at du vil slette denne annonce?")) return
    setDeletingId(id)
    const supabase = createClient()
    await supabase.from("listings").delete().eq("id", id)
    setListings(prev => prev.filter(l => l.id !== id))
    setDeletingId(null)
  }

  const statusLabel = (status: string) => {
    if (status === "active") return { text: "Aktiv", cls: "bg-green-100 text-green-700" }
    if (status === "draft") return { text: "Kladde", cls: "bg-yellow-100 text-yellow-700" }
    return { text: status, cls: "bg-gray-100 text-gray-600" }
  }

  return (
    <DashboardLayout>
      <div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mine annoncer</h1>
            <p className="text-gray-500 text-sm mt-1">{listings.length} annonce{listings.length !== 1 ? "r" : ""} total</p>
          </div>
          <a
            href="/opret-annonce"
            className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-colors"
          >
            ➕ Ny annonce
          </a>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : listings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
            <p className="text-5xl mb-4">📋</p>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Ingen annoncer endnu</h2>
            <p className="text-gray-500 mb-6">Opret din første annonce og nå tusindvis af brugere</p>
            <a
              href="/opret-annonce"
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-medium text-sm transition-colors inline-block"
            >
              Opret din første annonce
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {listings.map((listing) => {
              const badge = statusLabel(listing.status)
              return (
                <div key={listing.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                  {/* Image */}
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                    {listing.profile_image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={listing.profile_image} alt={listing.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">📷</div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{listing.title}</h3>
                    <p className="text-sm text-gray-500">{listing.category} • {listing.location}</p>
                    <p className="text-xs text-gray-400 mt-1">{new Date(listing.created_at).toLocaleDateString("da-DK")}</p>
                  </div>

                  {/* Status badge */}
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${badge.cls}`}>
                    {badge.text}
                  </span>

                  {/* Actions */}
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => router.push(`/dashboard/annoncer/${listing.id}/edit`)}
                      className="px-4 py-2 rounded-xl text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                    >
                      Rediger
                    </button>
                    <button
                      onClick={() => handleDelete(listing.id)}
                      disabled={deletingId === listing.id}
                      className="px-4 py-2 rounded-xl text-sm font-medium bg-red-50 hover:bg-red-100 text-red-600 transition-colors disabled:opacity-50"
                    >
                      {deletingId === listing.id ? "..." : "Slet"}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
