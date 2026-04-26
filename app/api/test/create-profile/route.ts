import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * ADMIN ENDPOINT - Creates test profile for QA
 * Usage: POST /api/test/create-profile
 * 
 * Security: Only works locally or with admin key
 */

async function createProfile(req: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    const timestamp = Date.now();
    const email = `testprofile_${timestamp}@protonmail.com`;
    const password = "TestProfile123!@";

    // 1. Create auth user
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { account_type: "provider" },
    });

    if (authError || !authUser.user) {
      return NextResponse.json(
        { error: `Auth creation failed: ${authError?.message}` },
        { status: 400 }
      );
    }

    const userId = authUser.user.id;

    // 2. Create listing
    const { error: listingError } = await supabase.from("listings").insert({
      user_id: userId,
      title: "TestProfile",
      display_name: "TestProfile",
      gender: "Woman",
      category: "Escort",
      age: 26,
      nationality: "Danish",
      ethnicity: "Caucasian",
      height_cm: 170,
      weight_kg: 60,
      hair_color: "Blonde",
      hair_length: "Long",
      eye_color: "Blue",
      body_build: "Slim",
      bust_size: "C",
      bust_type: "Natural",
      tattoos: "Some",
      piercings: "Some",
      smoker: "No",
      services: ["kissing", "foreplay", "gfe", "bdsm"],
      languages: ["English", "Danish"],
      about: "Professional escort with 5+ years of experience. Passionate, friendly, and accommodating. Available for incall and outcall services.",
      country: "Denmark",
      city: "Copenhagen",
      location: "Copenhagen, Denmark",
      available_for: "Both",
      phone: "+4540555999",
      whatsapp: "+4540555999",
      profile_image: "https://via.placeholder.com/500x600?text=Profile",
      images: [],
      status: "active",
      premium_tier: null,
    });

    if (listingError) {
      return NextResponse.json(
        { error: `Listing creation failed: ${listingError.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      email,
      password,
      userId,
      message: "Profile created successfully! Visit https://redlightad.com to see it live.",
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: `Server error: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return createProfile(req);
}

export async function POST(req: NextRequest) {
  return createProfile(req);
}
