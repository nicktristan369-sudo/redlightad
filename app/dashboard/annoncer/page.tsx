"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import DashboardLayout from "@/components/DashboardLayout"
import { FileText, Image as ImageIcon } from "lucide-react"

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
    if (!confirm("Are you sure you want to delete this listing?")) return
    setDeletingId(id)
    const supabase = createClient()
    await supabase.from("listings").delete().eq("id", id)
    setListings(prev => prev.filter(l => l.id !== id))
    setDeletingId(null)
  }

  const statusLabel = (status: string) => {
    if (status === "active") return { text: "Active", cls: "bg-green-100 text-green-700" }
    if (status === "draft") return { text: "Draft", cls: "bg-yellow-100 text-yellow-700" }
    return { text: status, cls: "bg-gray-100 text-gray-600" }
  }

  return (
    <DashboardLayout>
      <div>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Listings</h1>
            <p className="text-gray-500 text-sm mt-1">{listings.length} listing{listings.length !== 1 ? "s" : ""} total</p>
          </div>
          <a
            href="/create-profile"
            className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-medium text-sm transition-colors"
          >
            New Listing
          </a>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : listings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
            <FileText size={40} color="#D1D5DB" className="mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No listings yet</h2>
            <p className="text-gray-500 mb-6">Create your first listing and reach thousands of users</p>
            <a
              href="/create-profile"
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-medium text-sm transition-colors inline-block"
            >
              Create your first listing
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {listings.map((listing) => {
              const badge = statusLabel(listing.status)
              return (
                <div key={listing.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                  {/* Image */}
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                    {listing.profile_image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={listing.profile_image} alt={listing.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><ImageIcon size={20} color="#D1D5DB" /></div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{listing.title}</h3>
                    <p className="text-sm text-gray-500">{listing.category} • {listing.location}</p>
                    <p className="text-xs text-gray-400 mt-1">{new Date(listing.created_at).toLocaleDateString("en-US")}</p>
                  </div>

                  {/* Status badge */}
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${badge.cls}`}>
                    {badge.text}
                  </span>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 flex-shrink-0 w-full sm:w-auto">
                    <a
                      href={`/upgrade?listing=${listing.id}`}
                      className="px-4 py-2 rounded-xl text-sm font-medium bg-yellow-50 hover:bg-yellow-100 text-yellow-700 transition-colors"
                    >
                      Upgrade
                    </a>
                    <button
                      onClick={() => router.push(`/dashboard/annoncer/${listing.id}/edit`)}
                      className="px-4 py-2 rounded-xl text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(listing.id)}
                      disabled={deletingId === listing.id}
                      className="px-4 py-2 rounded-xl text-sm font-medium bg-red-50 hover:bg-red-100 text-red-600 transition-colors disabled:opacity-50"
                    >
                      {deletingId === listing.id ? "..." : "Delete"}
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
