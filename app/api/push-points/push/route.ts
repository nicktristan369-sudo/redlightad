import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { listingId } = await req.json()
    if (!listingId) return NextResponse.json({ error: "Missing listingId" }, { status: 400 })

    // Auth
    const authHeader = req.headers.get("authorization")
    if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const token = authHeader.replace("Bearer ", "")
    const {
      data: { user },
      error: authErr,
    } = await adminSupabase.auth.getUser(token)
    if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // Check listing belongs to user
    const { data: listing } = await adminSupabase
      .from("listings")
      .select("id, user_id, country")
      .eq("id", listingId)
      .single()
    if (!listing || listing.user_id !== user.id)
      return NextResponse.json({ error: "Not your listing" }, { status: 403 })

    // Check push points balance
    const { data: wallet } = await adminSupabase
      .from("wallets")
      .select("push_points")
      .eq("user_id", user.id)
      .single()
    const points = wallet?.push_points ?? 0
    if (points < 1) return NextResponse.json({ error: "insufficient_points" }, { status: 402 })

    const now = new Date().toISOString()
    const boostScore = Math.floor(Date.now() / 1000) // Unix timestamp in seconds (fits in integer)

    // Deduct 1 point + update listing with boost score to move to top
    const [deductResult, updateResult] = await Promise.all([
      adminSupabase
        .from("wallets")
        .update({ push_points: points - 1 })
        .eq("user_id", user.id),
      adminSupabase
        .from("listings")
        .update({
          boost_score: boostScore,
          boost_purchased_at: now,
        })
        .eq("id", listingId),
    ])

    if (updateResult.error)
      return NextResponse.json({ error: updateResult.error.message }, { status: 500 })

    // Log push
    await adminSupabase.from("push_history").insert({
      user_id: user.id,
      listing_id: listingId,
      points_used: 1,
    })

    return NextResponse.json({ success: true, points_remaining: points - 1 })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
