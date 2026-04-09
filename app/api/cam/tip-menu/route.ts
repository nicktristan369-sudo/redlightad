import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const getAdmin = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)



export async function GET(req: NextRequest) {
  const listingId = req.nextUrl.searchParams.get("listingId")
  if (!listingId) return NextResponse.json({ error: "Missing listingId" }, { status: 400 })

  const { data, error } = await getAdmin()
    .from("cam_tip_menu")
    .select("id, action, rc_amount, sort_order")
    .eq("listing_id", listingId)
    .order("sort_order")

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ items: data })
}

export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "") ?? ""
  const { data: { user } } = await getAdmin().auth.getUser(token)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { listingId, action, rc_amount } = await req.json()
  if (!listingId || !action || !rc_amount) return NextResponse.json({ error: "Missing fields" }, { status: 400 })

  // Verify ownership
  const { data: listing } = await getAdmin().from("listings").select("user_id").eq("id", listingId).single()
  if (!listing || listing.user_id !== user.id) return NextResponse.json({ error: "Not your listing" }, { status: 403 })

  const { data, error } = await getAdmin().from("cam_tip_menu").insert({
    listing_id: listingId,
    action,
    rc_amount,
  }).select("id, action, rc_amount, sort_order").single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ item: data })
}

export async function DELETE(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "") ?? ""
  const { data: { user } } = await getAdmin().auth.getUser(token)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  // Verify ownership via listing
  const { data: item } = await getAdmin().from("cam_tip_menu").select("listing_id").eq("id", id).single()
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const { data: listing } = await getAdmin().from("listings").select("user_id").eq("id", item.listing_id).single()
  if (!listing || listing.user_id !== user.id) return NextResponse.json({ error: "Not your listing" }, { status: 403 })

  await getAdmin().from("cam_tip_menu").delete().eq("id", id)
  return NextResponse.json({ ok: true })
}
