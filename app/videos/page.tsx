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

  // Fetch one video per listing — the most recent unlocked video
  const { data: videos } = await supabase
    .from("listing_videos")
    .select(`
      id, url, thumbnail_url, title, is_locked, redcoin_price, views, likes, sort_order, created_at,
      listing_id,
      listings!inner(id, title, display_name, city, country, profile_image, premium_tier)
    `)
    .order("created_at", { ascending: false })
    .limit(500)

  // De-dupe: one video per listing but count total videos per listing
  const countMap: Record<string, number> = {}
  ;(videos ?? []).forEach((v: any) => {
    countMap[v.listing_id] = (countMap[v.listing_id] || 0) + 1
  })

  const seen = new Set<string>()
  const deduped = (videos ?? []).filter((v: any) => {
    if (seen.has(v.listing_id)) return false
    seen.add(v.listing_id)
    return true
  }).map((v: any) => ({ ...v, video_count: countMap[v.listing_id] || 1 }))

  return (
    <>
      <Navbar />
      <main style={{ background: "#F5F5F7", minHeight: "100vh" }}>
        <section className="py-8">
          <div className="mx-auto max-w-7xl px-4">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Videos</h1>
              <p className="text-gray-500 text-sm mt-1">Profiles with videos from around the world</p>
            </div>
            <VideoGrid videos={deduped as any} />
          </div>
        </section>
      </main>
    </>
  )
}
