import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

    // Try to insert listing
    const { data: listing, error } = await supabase
      .from("listings")
      .insert({
        user_id: userId,
        ...listingData,
        status: "active",
        premium_tier: null,
      })
      .select();

    if (error) {
      console.error("[listings/create] Supabase error:", error);
      
      // Handle FK constraint - user doesn't exist in auth.users
      if (error.message?.includes("violates foreign key")) {
        return NextResponse.json(
          { error: "User not found. Please sign up again." },
          { status: 400 }
        );
      }
      
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, listing });
  } catch (err) {
    console.error("[listings/create] Server error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
