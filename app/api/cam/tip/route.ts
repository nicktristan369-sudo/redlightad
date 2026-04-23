import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const getAdmin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  // Authenticate via Bearer token (same pattern as other API routes)
  const token = (req.headers.get("authorization") ?? "").replace("Bearer ", "").trim()
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: { user }, error: authErr } = await getAdmin().auth.getUser(token)
  if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { listingId, amount, viewerUsername } = await req.json()
  if (!listingId || !amount || amount < 1) {
    return NextResponse.json({ error: "Missing or invalid params" }, { status: 400 })
  }

  // Get listing → streamer user_id
  const { data: listing } = await getAdmin()
    .from("listings").select("user_id").eq("id", listingId).single()
  if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 })

  // Get viewer wallet balance (source of truth)
  const { data: viewerWallet } = await getAdmin()
    .from("wallets").select("balance").eq("user_id", user.id).maybeSingle()
  const currentBalance = viewerWallet?.balance ?? 0

  if (currentBalance < amount) {
    return NextResponse.json({ error: "Ikke nok RC", new_balance: currentBalance }, { status: 400 })
  }

  // Deduct from viewer
  const newBalance = currentBalance - amount
  if (viewerWallet) {
    const { error: deductErr } = await getAdmin()
      .from("wallets").update({ balance: newBalance }).eq("user_id", user.id)
    if (deductErr) return NextResponse.json({ error: "Kunne ikke trække RC" }, { status: 500 })
  } else {
    return NextResponse.json({ error: "Ingen wallet fundet" }, { status: 400 })
  }

  // Credit streamer wallet
  const { data: streamerWallet } = await getAdmin()
    .from("wallets").select("balance, total_earned").eq("user_id", listing.user_id).maybeSingle()
  if (streamerWallet) {
    await getAdmin().from("wallets")
      .update({ balance: streamerWallet.balance + amount, total_earned: (streamerWallet.total_earned || 0) + amount })
      .eq("user_id", listing.user_id)
  } else {
    await getAdmin().from("wallets")
      .insert({ user_id: listing.user_id, balance: amount, total_earned: amount })
  }

  // Log wallet transaction for streamer
  await getAdmin().from("wallet_transactions").insert({
    user_id: listing.user_id,
    type: "tip",
    amount,
    source_username: viewerUsername || null,
    note: "Tip modtaget fra live show",
  })

  // Insert chat message — realtime broadcaster til alle inkl. go-live
  await getAdmin().from("cam_messages").insert({
    room_id: listingId,
    user_id: user.id,
    username: viewerUsername || "Anonymous",
    message: `tipped ${amount} RedCoins`,
    is_tip: true,
    tip_amount: amount,
  })

  return NextResponse.json({ success: true, new_balance: newBalance })
}
