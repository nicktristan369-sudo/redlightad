import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabaseServer"

export async function POST(req: NextRequest) {
  try {
    const { videoId, action } = await req.json()
    const supabase = createServerClient()
    const { data } = await supabase.from("listing_videos").select("likes").eq("id", videoId).single()
    const newLikes = Math.max(0, (data?.likes ?? 0) + (action === "like" ? 1 : -1))
    await supabase.from("listing_videos").update({ likes: newLikes }).eq("id", videoId)
    return NextResponse.json({ ok: true, likes: newLikes })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
