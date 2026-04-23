import { createServerClient } from "@/lib/supabaseServer"
import { notFound, redirect } from "next/navigation"
import { headers } from "next/headers"
import { getCountryFromHeaders } from "@/lib/domain-country"

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const supabase = createServerClient()
  
  const { data: listing } = await supabase
    .from("listings")
    .select("title, about, city, country, profile_image")
    .eq("slug", slug)
    .eq("status", "active")
    .single()

  if (!listing) {
    return { title: "Profile Not Found | RedLightAD" }
  }

  return {
    title: `${listing.title} - ${listing.city}, ${listing.country} | RedLightAD`,
    description: listing.about?.slice(0, 160) || `View ${listing.title}'s profile on RedLightAD`,
    openGraph: {
      title: `${listing.title} - ${listing.city}`,
      description: listing.about?.slice(0, 160),
      images: listing.profile_image ? [listing.profile_image] : [],
    },
  }
}

export default async function ProfileSlugPage({ params }: Props) {
  const { slug } = await params
  const supabase = createServerClient()
  
  // Lookup listing by slug
  const { data: listing } = await supabase
    .from("listings")
    .select("id, slug")
    .eq("slug", slug)
    .eq("status", "active")
    .single()

  if (!listing) {
    notFound()
  }

  // Redirect to the full ads page with the ID
  // This keeps backwards compatibility while allowing nice URLs
  redirect(`/ads/${listing.id}`)
}
