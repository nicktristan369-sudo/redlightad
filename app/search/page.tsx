import { createServerClient } from "@/lib/supabaseServer"
import Navbar from "@/components/Navbar"
import SearchClient from "@/components/SearchClient"

type SearchParams = {
  q?: string
  country?: string
  city?: string
  category?: string
  gender?: string
  sort?: string
  page?: string
}

export async function generateMetadata({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams
  const q = params.q
  return {
    title: q ? `Search: ${q} | RedLightAD` : "Search Profiles | RedLightAD",
    description: "Search verified escort profiles worldwide",
  }
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams
  const supabase = createServerClient()
  const q = params.q?.trim() || ""
  const country = params.country || ""
  const city = params.city?.trim() || ""
  const category = params.category || ""
  const gender = params.gender || ""
  const sort = params.sort || "newest"
  const page = Math.max(1, parseInt(params.page || "1"))
  const PAGE_SIZE = 24
  const offset = (page - 1) * PAGE_SIZE

  let query = supabase
    .from("listings")
    .select("id, title, profile_image, video_url, age, gender, category, location, city, country, about, languages, premium_tier, created_at, voice_message_url, images", { count: "exact" })
    .eq("status", "active")

  if (q) {
    query = query.or(`title.ilike.%${q}%,about.ilike.%${q}%`)
  }
  if (country) query = query.ilike("country", country)
  if (city) query = query.ilike("city", `%${city}%`)
  if (category) query = query.ilike("category", category)
  if (gender) query = query.ilike("gender", gender)

  // Sorting
  if (sort === "popular") {
    query = query.order("created_at", { ascending: false })
  } else if (sort === "featured") {
    query = query.order("premium_tier", { ascending: true }).order("created_at", { ascending: false })
  } else {
    query = query.order("created_at", { ascending: false })
  }

  query = query.range(offset, offset + PAGE_SIZE - 1)

  const { data: listings, count } = await query

  // Suggested profiles for empty results
  let suggested: typeof listings = []
  if (listings?.length === 0 && q) {
    const { data } = await supabase
      .from("listings")
      .select("id, title, profile_image, video_url, age, gender, category, location, city, country, about, languages, premium_tier, created_at, voice_message_url, images")
      .eq("status", "active")
      .eq("premium_tier", "featured")
      .limit(6)
    suggested = data || []
  }

  return (
    <>
      <Navbar />
      <SearchClient
        initialListings={listings || []}
        totalCount={count || 0}
        suggested={suggested}
        searchParams={{ q, country, city, category, gender, sort, page }}
        pageSize={PAGE_SIZE}
      />
    </>
  )
}
