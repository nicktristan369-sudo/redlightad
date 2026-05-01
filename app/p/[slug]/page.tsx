import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { Metadata } from "next";

// SEO-friendly profile URL: /p/username
// Redirects to /ads/[slug] which handles rendering

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

// Generate metadata for SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: listing } = await supabase
    .from("listings")
    .select("id, title, display_name, about, city, country, profile_image, images, category")
    .eq("slug", slug)
    .eq("status", "active")
    .single();

  if (!listing) {
    return { title: "Profile Not Found | RedLightAD" };
  }

  const name = listing.display_name || listing.title || "Profile";
  const location = [listing.city, listing.country].filter(Boolean).join(", ");
  const desc = listing.about?.slice(0, 155) || `${name} - ${listing.category || "Escort"} in ${location}`;
  const image = listing.profile_image || listing.images?.[0];

  return {
    title: `${name} | ${location} - RedLightAD`,
    description: desc,
    keywords: [name, listing.category, listing.city, listing.country, "escort", "redlightad"].filter(Boolean).join(", "),
    openGraph: {
      title: `${name} | ${location}`,
      description: desc,
      type: "profile",
      url: `https://redlightad.com/p/${slug}`,
      images: image ? [{ url: image, width: 600, height: 800 }] : [],
      siteName: "RedLightAD",
    },
    twitter: {
      card: "summary_large_image",
      title: `${name} | ${location}`,
      description: desc,
      images: image ? [image] : [],
    },
    alternates: {
      canonical: `https://redlightad.com/p/${slug}`,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function ProfilePage({ params }: Props) {
  const { slug } = await params;

  // Redirect to /ads/[slug] which handles all rendering
  redirect(`/ads/${slug}`);
}
