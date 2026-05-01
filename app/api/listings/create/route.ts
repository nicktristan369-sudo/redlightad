import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Generate SEO-friendly slug from title/display_name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "") // Remove special chars
    .replace(/\s+/g, "-") // Spaces to hyphens
    .replace(/-+/g, "-") // Multiple hyphens to single
    .replace(/^-|-$/g, ""); // Trim hyphens
}

// Fields that exist in the listings table
const ALLOWED_FIELDS = [
  "title",
  "display_name",
  "gender",
  "category",
  "age",
  "nationality",
  "ethnicity",
  "height_cm",
  "weight_kg",
  "hair_color",
  "hair_length",
  "eye_color",
  "body_build",
  "bust_size",
  "bust_type",
  "pubic_hair",
  "tattoos",
  "piercings",
  "smoker",
  "services",
  "languages",
  "about",
  "country",
  "city",
  "location",
  "available_for",
  "phone",
  "whatsapp",
  "telegram",
  "profile_image",
  "images",
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, ...rawData } = body;

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // Filter to only allowed fields
    const listingData: Record<string, unknown> = {};
    for (const key of ALLOWED_FIELDS) {
      if (key in rawData && rawData[key] !== undefined && rawData[key] !== null) {
        listingData[key] = rawData[key];
      }
    }

    // Use service role to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    // Generate slug from title or display_name
    const baseName = (listingData.display_name || listingData.title || "profile") as string;
    let slug = generateSlug(baseName);
    
    // Ensure slug is unique by adding random suffix if needed
    const { data: existing } = await supabase
      .from("listings")
      .select("id")
      .eq("slug", slug)
      .limit(1);
    
    if (existing && existing.length > 0) {
      // Add random 4-char suffix
      slug = `${slug}-${Math.random().toString(36).substring(2, 6)}`;
    }

    // Try to insert listing
    const { data: listing, error } = await supabase
      .from("listings")
      .insert({
        user_id: userId,
        ...listingData,
        slug,
        status: "active",
        premium_tier: null,
      })
      .select();

    if (error) {
      console.error("[listings/create] Supabase error:", JSON.stringify(error, null, 2));
      console.error("[listings/create] Error code:", error.code);
      console.error("[listings/create] Error details:", error.details);
      console.error("[listings/create] Error hint:", error.hint);
      
      // Return the actual error message for debugging
      return NextResponse.json(
        { error: error.message || "Database error", code: error.code, details: error.details },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, listing });
  } catch (err) {
    console.error("[listings/create] Server error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
