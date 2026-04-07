import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const { listingId, amount, viewerUsername } = await req.json()
  if (!listingId || !amount) return NextResponse.json({ error: "Missing params" }, { status: 400 })

  const { data: listing } = await supabaseAdmin
    .from("listings").select("user_id").eq("id", listingId).single()
  if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 })

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

  return NextResponse.json({ success: true })
}
