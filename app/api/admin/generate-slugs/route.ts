import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// Generate SEO-friendly slug
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch all listings without slugs
    const { data: listings, error } = await supabase
      .from("listings")
      .select("id, display_name, title, slug")
      .or("slug.is.null,slug.eq.");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const updates: { id: string; slug: string }[] = [];
    const usedSlugs = new Set<string>();

    // First, get all existing slugs
    const { data: existingSlugs } = await supabase
      .from("listings")
      .select("slug")
      .not("slug", "is", null);
    
    for (const s of existingSlugs ?? []) {
      if (s.slug) usedSlugs.add(s.slug);
    }

    for (const listing of listings ?? []) {
      const baseName = listing.display_name || listing.title || `profile-${listing.id.slice(0, 8)}`;
      let slug = generateSlug(baseName);
      
      // Ensure unique
      if (usedSlugs.has(slug) || !slug) {
        slug = `${slug || "profile"}-${Math.random().toString(36).substring(2, 6)}`;
      }
      
      usedSlugs.add(slug);
      updates.push({ id: listing.id, slug });
    }

    // Update each listing
    let updated = 0;
    for (const u of updates) {
      const { error: updateError } = await supabase
        .from("listings")
        .update({ slug: u.slug })
        .eq("id", u.id);
      
      if (!updateError) updated++;
    }

    return NextResponse.json({ 
      success: true, 
      total: listings?.length ?? 0,
      updated,
      slugs: updates.map(u => u.slug),
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
