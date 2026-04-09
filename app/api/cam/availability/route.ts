import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"


const getAdmin = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(req: NextRequest) {
  const listingId = req.nextUrl.searchParams.get("listingId")
  if (!listingId) return NextResponse.json({ error: "Missing listingId" }, { status: 400 })

  const { data, error } = await getAdmin()
    .from("listings")
    .select("cam_status, cam_available_until, cam_scheduled_at")
    .eq("id", listingId)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  const token = authHeader?.replace("Bearer ", "")
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Verify user from token
  const { data: { user }, error: authError } = await getAdmin().auth.getUser(token)
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { listingId, status, availableUntil, scheduledAt } = body

  if (!listingId || !status) return NextResponse.json({ error: "Missing fields" }, { status: 400 })
  if (!["offline", "available", "scheduled"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 })
  }

  // Verify ownership
  const { data: listing } = await getAdmin()
    .from("listings")
    .select("user_id")
    .eq("id", listingId)
    .single()

  if (!listing || listing.user_id !== user.id) {
    return NextResponse.json({ error: "Not your listing" }, { status: 403 })
  }

  // Update
  const { error } = await getAdmin()
    .from("listings")
    .update({
      cam_status: status,
      cam_available_until: status === "available" ? availableUntil : null,
      cam_scheduled_at: status === "scheduled" ? scheduledAt : null,
    })
    .eq("id", listingId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
