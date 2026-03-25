import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"

const getClient = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { listing_id, media_url, media_type, caption } = body

  if (!listing_id || !media_url) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const supabase = getClient()
  const { data, error } = await supabase.from("stories").insert({
    listing_id,
    media_url,
    media_type: media_type ?? "image",
    caption: caption ?? null,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ story: data })
}
