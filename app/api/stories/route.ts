import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getCountryVariants } from "@/lib/countries"

export const dynamic = "force-dynamic"

const getClient = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const country = searchParams.get("country")
  const supabase = getClient()

  // Delete expired stories first
  await supabase.from("stories").delete().lt("expires_at", new Date().toISOString())

  // Fetch active stories with listing info
  const query = supabase
    .from("stories")
    .select("id, listing_id, media_url, media_type, caption, views, created_at, expires_at, listings(id, title, profile_image, country, city)")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Filter by country client-side if provided
  let stories = data ?? []
  if (country) {
    const variants = getCountryVariants(country)
    stories = stories.filter((s: any) => variants.includes(s.listings?.country))
  }

  // Group by listing_id (one circle per profile, multiple stories inside)
  const grouped: Record<string, any> = {}
  for (const s of stories) {
    const lid = s.listing_id
    if (!grouped[lid]) {
      grouped[lid] = {
        listing_id: lid,
        listing: s.listings,
        stories: [],
      }
    }
    grouped[lid].stories.push(s)
  }

  return NextResponse.json({ groups: Object.values(grouped) })
}
