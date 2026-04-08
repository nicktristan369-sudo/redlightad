import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createServerClient } from "@/lib/supabaseServer"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  // Authenticate user via session
  const supabaseUser = createServerClient()
  const { data: { user } } = await supabaseUser.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { listingId, amount, viewerUsername } = await req.json()
  if (!listingId || !amount || amount < 1) {
    return NextResponse.json({ error: "Missing or invalid params" }, { status: 400 })
  }

  // Get listing → streamer user_id
  const { data: listing } = await supabaseAdmin
    .from("listings").select("user_id").eq("id", listingId).single()
  if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 })

  // Get viewer balance
  const { data: cp } = await supabaseAdmin
    .from("customer_profiles").select("redcoins").eq("user_id", user.id).maybeSingle()
  const currentBalance = cp?.redcoins ?? 0

  if (currentBalance < amount) {
    return NextResponse.json({ error: "Ikke nok RC", new_balance: currentBalance }, { status: 400 })
  }

  // Deduct from viewer (server-side, bypasses RLS)
  const newBalance = currentBalance - amount
  const { error: deductErr } = await supabaseAdmin
    .from("customer_profiles")
    .update({ redcoins: newBalance })
    .eq("user_id", user.id)
  if (deductErr) {
    return NextResponse.json({ error: "Kunne ikke trække RC" }, { status: 500 })
  }

  // Credit streamer wallet
  const { data: wallet } = await supabaseAdmin
    .from("wallets").select("balance, total_earned").eq("user_id", listing.user_id).maybeSingle()
  if (wallet) {
    await supabaseAdmin.from("wallets")
      .update({ balance: wallet.balance + amount, total_earned: (wallet.total_earned || 0) + amount })
      .eq("user_id", listing.user_id)
  } else {
    await supabaseAdmin.from("wallets")
      .insert({ user_id: listing.user_id, balance: amount, total_earned: amount })
  }

  // Log wallet transaction
  await supabaseAdmin.from("wallet_transactions").insert({
    user_id: listing.user_id,
    type: "tip",
    amount,
    source_username: viewerUsername || null,
    note: "Tip modtaget fra live show",
  })

  // Insert chat message (realtime vil broadcaste til alle)
  await supabaseAdmin.from("cam_messages").insert({
    room_id: listingId,
    user_id: user.id,
    username: viewerUsername || "Anonymous",
    message: `tipped ${amount} RedCoins`,
    is_tip: true,
    tip_amount: amount,
  })

  return NextResponse.json({ success: true, new_balance: newBalance })
}
