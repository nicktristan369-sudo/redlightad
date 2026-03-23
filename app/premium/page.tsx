import { createServerClient } from "@/lib/supabaseServer"
import Navbar from "@/components/Navbar"
import FilterBar from "@/components/FilterBar"
import AdCard from "@/components/AdCard"

export const metadata = {
  title: "Premium Profiles | RedLightAD",
  description: "Browse verified premium escort profiles worldwide",
}

export default async function PremiumProfilesPage() {
  const supabase = createServerClient()

  const { data: listings } = await supabase
    .from("listings")
    .select("*, users!inner(is_premium, is_featured)")
    .eq("users.is_premium", true)
    .order("created_at", { ascending: false })

  // Sort featured first
  const sorted = (listings || []).sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
    const aFeatured = (a.users as Record<string, unknown>)?.is_featured ? 1 : 0
    const bFeatured = (b.users as Record<string, unknown>)?.is_featured ? 1 : 0
    return bFeatured - aFeatured
  })

  return (
    <>
      <Navbar />
      <FilterBar />
      <main className="bg-[#F5F5F7]">
        <section className="py-8">
          <div className="mx-auto max-w-7xl px-4">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Premium Profiles</h1>
              <p className="text-gray-500 mt-2">Verified premium members worldwide</p>
            </div>

            {sorted.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
                <p className="text-5xl mb-4">👑</p>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">No premium profiles yet</h2>
                <p className="text-gray-500">Check back soon for verified premium members</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {sorted.map((ad: Record<string, unknown>) => (
                  <div key={ad.id as string} className="relative">
                    {/* Crown badge */}
                    <div className="absolute top-3 right-3 z-20 text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full"
                      style={{ backgroundColor: "rgba(0,0,0,0.75)", color: "#D4AF37", border: "1px solid rgba(212,175,55,0.4)" }}>
                      👑
                    </div>
                    <AdCard
                      id={ad.id as number}
                      title={ad.title as string}
                      image={ad.profile_image as string || "/placeholder.jpg"}
                      verified={true}
                      description={ad.about as string || ""}
                      hasVoice={false}
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
