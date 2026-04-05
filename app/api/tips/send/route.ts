import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabaseServer"

export async function POST(req: NextRequest) {
  const supabase = createServerClient()

  const authHeader = req.headers.get("authorization")
  let user = null

  // Get user from session cookie
  const { data: { user: sessionUser } } = await supabase.auth.getUser()
  user = sessionUser

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { listingId, toUserId, amount, message } = await req.json()

  if (!amount || amount < 10) {
    return NextResponse.json({ error: "Minimum 10 Red Coins" }, { status: 400 })
  }

  // Check om sender er customer
  const { data: customerProfile } = await supabase
    .from("customer_profiles")
    .select("redcoins")
    .eq("user_id", user.id)
    .single()

  if (!customerProfile || customerProfile.redcoins < amount) {
    return NextResponse.json({ error: "Insufficient Red Coins" }, { status: 400 })
  }

  // Deduct fra customer
  const { error: deductErr } = await supabase
    .from("customer_profiles")
    .update({ redcoins: customerProfile.redcoins - amount })
    .eq("user_id", user.id)

  if (deductErr) return NextResponse.json({ error: "Failed to deduct" }, { status: 500 })

  // Add til provider wallet
  const { data: wallet } = await supabase
    .from("wallets")
    .select("balance")
    .eq("user_id", toUserId)
    .single()

  if (wallet) {
    await supabase
      .from("wallets")
      .update({ balance: wallet.balance + amount })
      .eq("user_id", toUserId)
  } else {
    await supabase
      .from("wallets")
      .insert({ user_id: toUserId, balance: amount })
  }

  // Log tip
  await supabase.from("redcoin_tips").insert({
    from_user_id: user.id,
    to_listing_id: listingId,
    to_user_id: toUserId,
    amount,
    message: message || null,
  })

  return NextResponse.json({ ok: true })
}
