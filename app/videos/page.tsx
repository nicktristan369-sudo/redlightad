import { createServerClient } from "@/lib/supabaseServer"
import Navbar from "@/components/Navbar"
import VideoGrid from "@/components/VideoGrid"

export const revalidate = 60

export const metadata = {
  title: "Videos | RedLightAD",
  description: "Watch exclusive videos from profiles worldwide",
}

export default async function VideosPage() {
  const supabase = createServerClient()

  // Fetch all videos with listing info
  const { data: videos } = await supabase
    .from("listing_videos")
    .select(`
      id, url, thumbnail_url, title, is_locked, redcoin_price, views, likes, sort_order, created_at,
      listing_id,
      listings!inner(id, title, display_name, city, country, profile_image, premium_tier)
    `)
    .order("created_at", { ascending: false })
    .limit(500)

  // Count videos per listing for badge
  const countMap: Record<string, number> = {}
  ;(videos ?? []).forEach((v: any) => {
    countMap[v.listing_id] = (countMap[v.listing_id] || 0) + 1
  })

  // Add video count to each video
  const videosWithCount = (videos ?? []).map((v: any) => ({
    ...v,
    video_count: countMap[v.listing_id] || 1
  }))

  return (
    <>
      <Navbar />
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
