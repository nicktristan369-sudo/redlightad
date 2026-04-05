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
      .from("customer_kyc_requests")
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
    const body = await req.json()
    const { id, user_id, action } = body

    if (!id || !user_id || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }

    const supabase = db()
    const status = action === "approve" ? "approved" : "rejected"

    const { error: updateErr } = await supabase
      .from("customer_kyc_requests")
      .update({ status, reviewed_at: new Date().toISOString() })
      .eq("id", id)

    if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

    if (action === "approve") {
      await supabase
        .from("customer_profiles")
        .update({ kyc_verified: true })
        .eq("user_id", user_id)
    }

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 })
  }
}
