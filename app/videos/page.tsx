import { createServerClient } from "@/lib/supabaseServer"
import Navbar from "@/components/Navbar"
import VideoGrid from "@/components/VideoGrid"

export const revalidate = 60

export const metadata = {
  title: "Videos | RedLightAD",
  description: "Watch exclusive videos from verified profiles worldwide",
}

export default async function VideosPage() {
  const supabase = createServerClient()

  const { data: videos } = await supabase
    .from("listing_videos")
    .select("id, url, thumbnail_url, title, is_locked, redcoin_price, views, likes, duration, created_at, listings!inner(name, city, country, slug)")
    .eq("is_locked", false)
    .order("created_at", { ascending: false })

  return (
    <>
      <Navbar />
      <main className="bg-[#F5F5F7]">
        <section className="py-8">
          <div className="mx-auto max-w-7xl px-4">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Videos</h1>
              <p className="text-gray-500 mt-2">Exclusive videos from verified profiles</p>
            </div>
            <VideoGrid videos={(videos as any) || []} />
          </div>
        </section>
      </main>
    </>
  )
}
