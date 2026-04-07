import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST /api/cam/private — request, accept, decline, end, or bill
export async function POST(req: NextRequest) {
  const { action, listingId, viewerId, viewerUsername, tokensPerMin, requestId } = await req.json()

  if (action === "request") {
    // Viewer requests private show
    const roomName = `private-${listingId}-${viewerId}-${Date.now()}`
    const { data, error } = await supabaseAdmin.from("cam_private_requests").insert({
      listing_id: listingId,
      viewer_id: viewerId,
      viewer_username: viewerUsername,
      tokens_per_min: tokensPerMin,
      status: "pending",
      room_name: roomName,
    }).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ request: data })
  }

  if (action === "accept") {
    const { error } = await supabaseAdmin.from("cam_private_requests")
      .update({ status: "accepted", accepted_at: new Date().toISOString() })
      .eq("id", requestId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  if (action === "decline") {
    const { error } = await supabaseAdmin.from("cam_private_requests")
      .update({ status: "declined" })
      .eq("id", requestId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  if (action === "end") {
    const { error } = await supabaseAdmin.from("cam_private_requests")
      .update({ status: "ended", ended_at: new Date().toISOString() })
      .eq("id", requestId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  if (action === "bill") {
    // Deduct 1 minute of coins from viewer
    const { data: req_ } = await supabaseAdmin.from("cam_private_requests")
      .select("*").eq("id", requestId).single()
    if (!req_ || req_.status !== "accepted") return NextResponse.json({ ended: true })

    const { data: cp } = await supabaseAdmin.from("customer_profiles")
      .select("redcoins").eq("user_id", req_.viewer_id).maybeSingle()

    const balance = cp?.redcoins || 0
    if (balance < req_.tokens_per_min) {
      // Out of coins — end show
      await supabaseAdmin.from("cam_private_requests")
        .update({ status: "ended", ended_at: new Date().toISOString() })
        .eq("id", requestId)
      return NextResponse.json({ ended: true, reason: "insufficient_coins" })
    }

    // Deduct coins
    await supabaseAdmin.from("customer_profiles")
      .update({ redcoins: balance - req_.tokens_per_min })
      .eq("user_id", req_.viewer_id)

    // Credit model's wallet
    const { data: modelListing } = await supabaseAdmin.from("listings")
      .select("user_id").eq("id", req_.listing_id).single()
    if (modelListing) {
      const { data: modelWallet } = await supabaseAdmin.from("wallets")
        .select("balance").eq("user_id", modelListing.user_id).maybeSingle()
      if (modelWallet) {
        await supabaseAdmin.from("wallets")
          .update({ balance: modelWallet.balance + req_.tokens_per_min })
          .eq("user_id", modelListing.user_id)
      } else {
        await supabaseAdmin.from("wallets")
          .insert({ user_id: modelListing.user_id, balance: req_.tokens_per_min })
      }
    }

    return NextResponse.json({ success: true, deducted: req_.tokens_per_min, remaining: balance - req_.tokens_per_min })
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 })
}
