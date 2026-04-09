import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const getAdmin = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)



export async function GET(req: NextRequest) {
  const listingId = req.nextUrl.searchParams.get("listingId")
  if (!listingId) return NextResponse.json({ error: "Missing listingId" }, { status: 400 })

  const { data, error } = await getAdmin()
    .from("listings")
    .select("cam_goal_title, cam_goal_target, cam_goal_current, cam_goal_active")
    .eq("id", listingId)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "") ?? ""
  const { data: { user } } = await getAdmin().auth.getUser(token)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { listingId, title, target, active } = await req.json()
  if (!listingId) return NextResponse.json({ error: "Missing listingId" }, { status: 400 })

  // Verify ownership
  const { data: listing } = await getAdmin().from("listings").select("user_id").eq("id", listingId).single()
  if (!listing || listing.user_id !== user.id) return NextResponse.json({ error: "Not your listing" }, { status: 403 })

  const { error } = await getAdmin().from("listings").update({
    cam_goal_title: title,
    cam_goal_target: target,
    cam_goal_active: active,
    cam_goal_current: 0,
  }).eq("id", listingId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function PUT(req: NextRequest) {
  const { listingId, amount } = await req.json()
  if (!listingId || !amount) return NextResponse.json({ error: "Missing fields" }, { status: 400 })

  const { data: listing } = await getAdmin()
    .from("listings")
    .select("cam_goal_current")
    .eq("id", listingId)
    .single()

  if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const { error } = await getAdmin().from("listings").update({
    cam_goal_current: (listing.cam_goal_current || 0) + amount,
  }).eq("id", listingId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, new_current: (listing.cam_goal_current || 0) + amount })
}
