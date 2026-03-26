import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const db = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

export async function GET() {
  try {
    const supabase = db()
    const { data, error } = await supabase
      .from("payout_details")
      .select("*")
      .order("created_at", { ascending: false })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const { payout_detail_id } = await req.json()
    if (!payout_detail_id) return NextResponse.json({ error: "payout_detail_id required" }, { status: 400 })
    const supabase = db()
    const { error } = await supabase
      .from("payout_details")
      .update({ is_verified: true, id_verified: true, verified_at: new Date().toISOString() })
      .eq("id", payout_detail_id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 })
  }
}
