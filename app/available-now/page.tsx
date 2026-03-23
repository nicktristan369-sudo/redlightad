import { createServerClient } from "@/lib/supabaseServer"
import Navbar from "@/components/Navbar"
import FilterBar from "@/components/FilterBar"
import AdCard from "@/components/AdCard"

export const revalidate = 300

export const metadata = {
  title: "Available Now | RedLightAD",
  description: "Browse profiles available at this moment",
}

export default async function AvailableNowPage() {
  const supabase = createServerClient()

  const { data: listings } = await supabase
    .rpc("get_available_now_listings")

  const results = (listings || []) as Record<string, unknown>[]

  return (
    <>
      <Navbar />
      <FilterBar />
      <main className="bg-[#F5F5F7]">
        <section className="py-8">
          <div className="mx-auto max-w-7xl px-4">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Available Now</h1>
              <p className="text-gray-500 mt-2">Profiles available at this moment</p>
            </div>

            {results.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">No profiles available right now</h2>
                <p className="text-gray-500">Check back soon</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {results.map((ad) => (
                  <div key={ad.id as string} className="relative">
                    <span className="absolute top-2 left-2 z-10 w-2.5 h-2.5 bg-green-500 rounded-full" />
                    <AdCard
                      id={ad.id as number}
                      title={ad.title as string}
                      image={ad.profile_image as string || "/placeholder.jpg"}
                      verified={false}
                      description={ad.about as string || ""}
                      hasVoice={!!ad.voice_message_url}
                      voiceUrl={ad.voice_message_url as string | null}
                      hasVideo={!!ad.video_url}
                      videoUrl={ad.video_url as string}
                      age={ad.age as number || 0}
                      gender={ad.gender as string || ""}
                      category={ad.category as string || ""}
                      country={ad.country as string}
                      city={ad.city as string}
                      location={ad.location as string}
                      language={(ad.languages as string[])?.[0] || ""}
                      premium_tier={ad.premium_tier as string}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </>
  )
}
