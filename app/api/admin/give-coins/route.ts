import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { userId, coins } = await req.json()
    if (!userId || !coins || coins <= 0) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 })
    }

    // Get current balance (if wallet exists)
    const { data: existing } = await supabaseAdmin
      .from("wallets")
      .select("balance")
      .eq("user_id", userId)
      .maybeSingle()

    if (existing) {
      // Wallet exists — increment
      const { error } = await supabaseAdmin
        .from("wallets")
        .update({ balance: existing.balance + coins })
        .eq("user_id", userId)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    } else {
      // Create wallet with coins
      const { error } = await supabaseAdmin
        .from("wallets")
        .insert({ user_id: userId, balance: coins })
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Log as admin grant
    await supabaseAdmin.from("coin_purchases").insert({
      user_id: userId,
      coins_amount: coins,
      price_usd: 0,
      stripe_payment_id: `ADMIN_GRANT_${Date.now()}`,
    })

    // Return new balance
    const { data: wallet } = await supabaseAdmin
      .from("wallets")
      .select("balance")
      .eq("user_id", userId)
      .single()

    return NextResponse.json({ success: true, newBalance: wallet?.balance ?? coins })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Error" }, { status: 500 })
  }
}
