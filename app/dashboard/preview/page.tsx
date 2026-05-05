"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import DashboardLayout from "@/components/DashboardLayout"
import { ExternalLink } from "lucide-react"

export default function PreviewPage() {
  const router = useRouter()
  const [listingSlug, setListingSlug] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.replace("/login")
        return
      }

      // Get user's listing
      const { data: listing } = await supabase
        .from("listings")
        .select("slug")
        .eq("user_id", user.id)
        .in("status", ["active", "pending"])
        .limit(1)
        .single()

      if (listing?.slug) {
        setListingSlug(listing.slug)
      }
      setLoading(false)
    })
  }, [router])

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  if (!listingSlug) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">No profile yet</h1>
            <p className="text-gray-500 mb-6">Create a profile to see your preview here.</p>
            <a href="/create-profile" className="inline-block px-6 py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800">
              Create Profile
            </a>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Preview</h1>
            <p className="text-gray-500 mt-1">See how your profile looks to visitors</p>
          </div>
          <a
            href={`/ads/${listingSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors"
          >
            <ExternalLink size={16} />
            Open in new tab
          </a>
        </div>

        {/* Preview container */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-lg">
          <iframe
            src={`/ads/${listingSlug}`}
            className="w-full"
            style={{ height: "800px", border: "none" }}
            title="Profile Preview"
          />
        </div>

        <p className="text-sm text-gray-500 mt-4 text-center">
          This is how your profile appears to other users on the platform
        </p>
      </div>
    </DashboardLayout>
  )
}
