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
  "eye_color",
  "body_build",
  "smoker",
  "services",
  "languages",
  "about",
  "country",
  "city",
  "location",
  "phone",
  "whatsapp",
  "telegram",
  "profile_image",
  "images",
  // Extended fields - uncomment when migration is run:
  // "hair_length",
  // "bust_size",
  // "bust_type",
  // "pubic_hair",
  // "tattoos",
  // "piercings",
  // "available_for",
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, ...rawData } = body;

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // Filter to only allowed fields to avoid schema cache errors
    const listingData: Record<string, unknown> = {};
    for (const key of ALLOWED_FIELDS) {
      if (key in rawData && rawData[key] !== undefined) {
        listingData[key] = rawData[key];
      }
    }

    // Use service role to bypass RLS — user may not be email-confirmed yet
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    const { error } = await supabase.from("listings").insert({
      user_id: userId,
      ...listingData,
      status: "pending",
      premium_tier: null,
    });

    if (error) {
      console.error("[listings/create] Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[listings/create] Server error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
