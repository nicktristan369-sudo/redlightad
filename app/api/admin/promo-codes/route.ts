import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

export async function GET() {
  const supabase = getAdmin()
  const { data, error } = await supabase
    .from("promo_codes")
    .select("*")
    .order("created_at", { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ codes: data })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const supabase = getAdmin()
  const { error } = await supabase.from("promo_codes").insert({
    code: body.code,
    description: body.description || null,
    discount_type: body.discount_type,
    trial_days: body.trial_days || null,
    discount_percent: body.discount_percent || null,
    discount_fixed: body.discount_fixed || null,
    applies_to: body.applies_to || null,
    max_uses: body.max_uses || null,
    expires_at: body.expires_at || null,
    is_active: true,
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function PATCH(req: NextRequest) {
  const { id, is_active } = await req.json()
  const supabase = getAdmin()
  const { error } = await supabase.from("promo_codes").update({ is_active }).eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  const supabase = getAdmin()
  const { error } = await supabase.from("promo_codes").delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
