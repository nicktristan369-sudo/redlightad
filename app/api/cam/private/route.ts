import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const getAdmin = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// POST /api/cam/private — request, accept, decline, end, or bill
export async function POST(req: NextRequest) {
  const { action, listingId, viewerId, viewerUsername, tokensPerMin, requestId } = await req.json()

  if (action === "request") {
    const roomName = `private-${listingId}-${viewerId}-${Date.now()}`
    const { data, error } = await getAdmin().from("cam_private_requests").insert({
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
    const { error } = await getAdmin().from("cam_private_requests")
      .update({ status: "accepted", accepted_at: new Date().toISOString() })
      .eq("id", requestId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  if (action === "decline") {
    const { error } = await getAdmin().from("cam_private_requests")
      .update({ status: "declined" }).eq("id", requestId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  if (action === "end") {
    const { error } = await getAdmin().from("cam_private_requests")
      .update({ status: "ended", ended_at: new Date().toISOString() }).eq("id", requestId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  if (action === "bill") {
    const supabase = getAdmin()

    // Get request details
    const { data: req_ } = await supabase.from("cam_private_requests")
      .select("*").eq("id", requestId).single()
    if (!req_ || req_.status !== "accepted") return NextResponse.json({ ended: true })

    // ── VIEWER: deduct from wallets.balance (source of truth) ──
    const { data: viewerWallet } = await supabase.from("wallets")
      .select("balance").eq("user_id", req_.viewer_id).maybeSingle()

    const viewerBalance = viewerWallet?.balance ?? 0

    if (viewerBalance < req_.tokens_per_min) {
      // Out of coins — end show
      await supabase.from("cam_private_requests")
        .update({ status: "ended", ended_at: new Date().toISOString() }).eq("id", requestId)
      return NextResponse.json({ ended: true, reason: "insufficient_coins" })
    }

    // Deduct from viewer wallet
    const newViewerBalance = viewerBalance - req_.tokens_per_min
    await supabase.from("wallets")
      .update({ balance: newViewerBalance }).eq("user_id", req_.viewer_id)

    // Log transaction
    await supabase.from("wallet_transactions").insert({
      user_id: req_.viewer_id,
      amount: -req_.tokens_per_min,
      type: "private_show",
      description: `Private show — 1 min`,
    })

    // ── MODEL: credit wallets.balance ──
    const { data: modelListing } = await supabase.from("listings")
      .select("user_id").eq("id", req_.listing_id).single()

    if (modelListing?.user_id) {
      const { data: modelWallet } = await supabase.from("wallets")
        .select("balance").eq("user_id", modelListing.user_id).maybeSingle()

      const modelBalance = modelWallet?.balance ?? 0
      const newModelBalance = modelBalance + req_.tokens_per_min

      if (modelWallet) {
        await supabase.from("wallets")
          .update({ balance: newModelBalance }).eq("user_id", modelListing.user_id)
      } else {
        await supabase.from("wallets")
          .insert({ user_id: modelListing.user_id, balance: req_.tokens_per_min })
      }

      // Log model earning
      await supabase.from("wallet_transactions").insert({
        user_id: modelListing.user_id,
        amount: req_.tokens_per_min,
        type: "private_show_earning",
        description: `Private show earning — 1 min`,
      })
    }

    return NextResponse.json({
      success: true,
      deducted: req_.tokens_per_min,
      remaining: newViewerBalance,
    })
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 })
}
