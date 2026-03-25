import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"

const getClient = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const { story_id } = await req.json()
  if (!story_id) return NextResponse.json({ error: "Missing story_id" }, { status: 400 })
  const supabase = getClient()
  try {
    await supabase.rpc("increment_story_views", { sid: story_id })
  } catch {
    // fallback: direct increment
    await supabase.from("stories").update({ views: 1 }).eq("id", story_id)
  }
  return NextResponse.json({ ok: true })
}
