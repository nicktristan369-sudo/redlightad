import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabaseServer"

export async function POST(req: NextRequest) {
  try {
    const { videoId } = await req.json()
    const supabase = createServerClient()
    const { data } = await supabase.from("listing_videos").select("views").eq("id", videoId).single()
    await supabase.from("listing_videos").update({ views: (data?.views ?? 0) + 1 }).eq("id", videoId)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true })
  }
}
