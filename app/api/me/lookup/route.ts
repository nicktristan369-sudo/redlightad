import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const getClient = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function uuidPrefixFromCode(code: string): string {
  const num = parseInt(code, 36)
  const hex = num.toString(16).padStart(10, '0')
  return hex.slice(0, 8) + '-' + hex.slice(8, 10)
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code") || ""
  if (!code || code.length < 6) return NextResponse.json({ error: "Invalid code" }, { status: 400 })

  const prefix = uuidPrefixFromCode(code)
  const sb = getClient()

  // UUID range query: alle UUIDs der starter med prefix
  // fx prefix = "5afc3119-a9" 
  // gte: 5afc3119-a900-0000-0000-000000000000
  // lte: 5afc3119-a9ff-ffff-ffff-ffffffffffff
  const low  = prefix + "00-0000-0000-000000000000"
  const high = prefix + "ff-ffff-ffff-ffffffffffff"

  const { data, error } = await sb
    .from("listings")
    .select("id, slug, title, display_name, about, age, city, country, premium_tier, profile_image, profile_video_url, images, videos, video_url, voice_message_url, phone, whatsapp, telegram, social_links, services, languages, rate_1hour, rate_2hours, rate_overnight, height_cm, body_build, ethnicity, hair_color, kyc_status, category")
    .eq("status", "active")
    .gte("id", low)
    .lte("id", high)
    .limit(1)
    .maybeSingle()

  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (!["vip", "featured", "basic"].includes(data.premium_tier || "")) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  return NextResponse.json(data)
}
