import { createServerClient } from "@/lib/supabaseServer"
import Link from "next/link"

interface Props {
  country: string
}

interface Listing {
  id: string
  title: string
  profile_image: string | null
  age: number | null
  city: string | null
  location: string
  category: string | null
  about: string | null
  premium_tier: string | null
  created_at: string
}

export default async function CountryAdFeed({ country }: Props) {
  const supabase = createServerClient()
  const { data: listings } = await supabase
    .from("listings")
    .select("id, title, profile_image, age, city, location, category, about, premium_tier, created_at")
    .eq("status", "active")
    .ilike("country", country)
    .order("created_at", { ascending: false })
    .limit(40)

  const items = listings || []

  // Capitalise country name for display
  const countryLabel = country
    .split("-")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 pb-12">
        <div className="bg-white rounded-2xl p-12 text-center" style={{ border: "1px solid #E5E5E5" }}>
          {/* MapPin icon via inline SVG — no client boundary needed */}
          <div className="flex justify-center mb-5">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
          <h2 className="text-[18px] font-bold text-gray-900 mb-2">
            No profiles in {countryLabel} yet
          </h2>
          <p className="text-[14px] mb-6" style={{ color: "#9CA3AF" }}>
            Be the first to advertise here and reach thousands of visitors
          </p>
          <Link
            href="/opret-annonce"
            className="btn-post-ad inline-block text-[13px] font-semibold text-white px-6 py-2.5 rounded-xl"
          >
            Post an Ad →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 pb-12">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-gray-700">{items.length} profiles</p>
      </div>
      <div className="flex flex-col gap-3">
        {items.map(l => (
          <Link href={`/annoncer/${l.id}`} key={l.id}>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex gap-4 p-4 hover:shadow-md transition-shadow cursor-pointer">
              {/* Image */}
              <div className="flex-shrink-0 w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-gray-100">
                {l.profile_image
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={l.profile_image} alt={l.title} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center bg-gray-100"><svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg></div>}
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-gray-900 text-base leading-tight">
                      {l.title}{l.age ? `, ${l.age}` : ""}
                    </h3>
                    <p className="text-sm text-gray-400 mt-0.5">{l.city || l.location}</p>
                  </div>
                  {l.premium_tier && l.premium_tier !== "basic" && (
                    <span className="flex-shrink-0 text-[10px] font-bold uppercase tracking-wider bg-gray-900 text-white px-2 py-0.5 rounded-full">
                      {l.premium_tier === "vip" ? "VIP" : l.premium_tier.toUpperCase()}
                    </span>
                  )}
                </div>
                {l.about && (
                  <p className="text-sm text-gray-500 mt-2 line-clamp-2 leading-relaxed">{l.about}</p>
                )}
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {l.category && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">{l.category}</span>
                  )}
                  <span className="text-xs text-gray-300">
                    {new Date(l.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
