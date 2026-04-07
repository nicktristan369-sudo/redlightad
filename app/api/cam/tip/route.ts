import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST /api/cam/tip — credit model wallet when viewer sends tip
export async function POST(req: NextRequest) {
  const { listingId, amount } = await req.json()
  if (!listingId || !amount) return NextResponse.json({ error: "Missing params" }, { status: 400 })

  // Get model user_id from listing
  const { data: listing } = await supabaseAdmin
    .from("listings").select("user_id").eq("id", listingId).single()
  if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 })

  // Upsert model wallet
  const { data: wallet } = await supabaseAdmin
    .from("wallets").select("balance").eq("user_id", listing.user_id).maybeSingle()

  if (wallet) {
    await supabaseAdmin.from("wallets")
      .update({ balance: wallet.balance + amount })
      .eq("user_id", listing.user_id)
  } else {
    await supabaseAdmin.from("wallets")
      .insert({ user_id: listing.user_id, balance: amount })
  }

  return NextResponse.json({ success: true })
}
