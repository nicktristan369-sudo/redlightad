import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"

const getClient = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const { listing_id, reporter_id, reason, details } = await req.json()
  if (!listing_id || !reason) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }
  const supabase = getClient()
  const { error } = await supabase.from("reports").insert({
    listing_id,
    reporter_id: reporter_id ?? null,
    reason,
    details: details ?? null,
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
