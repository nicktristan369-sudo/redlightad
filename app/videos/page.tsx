import { createServerClient } from "@/lib/supabaseServer"
import { headers } from "next/headers"
import Navbar from "@/components/Navbar"
import VideoGrid from "@/components/VideoGrid"
import { getCountryFromHeaders } from "@/lib/domain-country"

export const revalidate = 60

export const metadata = {
  title: "Videos | RedLightAD",
  description: "Watch exclusive videos from profiles worldwide",
}

export default async function VideosPage() {
  const supabase = createServerClient()
  const headersList = await headers()
  const domainCountry = getCountryFromHeaders(headersList)

  // Fetch all videos with listing info including gender and category
  let query = supabase
    .from("listing_videos")
    .select(`
      id, url, thumbnail_url, title, is_locked, redcoin_price, views, likes, sort_order, created_at,
      listing_id,
      listings!inner(id, title, display_name, city, country, profile_image, premium_tier, gender, category)
    `)
    .order("created_at", { ascending: false })
    .limit(500)

  const { data: videos } = await query

  // Filter by domain country if on regional domain
  let filteredVideos = videos ?? []
  if (domainCountry) {
    const countryLower = domainCountry.toLowerCase()
    filteredVideos = filteredVideos.filter((v: any) => {
      const listingCountry = (v.listings?.country || '').toLowerCase()
      return listingCountry.includes(countryLower) || listingCountry === countryLower
    })
  }

  // Count videos per listing for badge
  const countMap: Record<string, number> = {}
  filteredVideos.forEach((v: any) => {
    countMap[v.listing_id] = (countMap[v.listing_id] || 0) + 1
  })

  // Add video count to each video
  const videosWithCount = filteredVideos.map((v: any) => ({
    ...v,
    video_count: countMap[v.listing_id] || 1
  }))

  return (
    <>
      <Navbar variant="dark" />
      <main style={{ background: "#0d0d0d", minHeight: "100vh" }}>
        <section className="py-8">
          <div className="mx-auto max-w-7xl px-4">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-white tracking-tight">Videos</h1>
              <p className="text-gray-500 text-sm mt-1">Watch exclusive content from profiles worldwide</p>
            </div>

            <VideoGrid videos={videosWithCount as any} />
          </div>
        </section>
      </main>
    </>
  )
}
