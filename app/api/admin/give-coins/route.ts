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

    // Ensure wallet exists
    await supabaseAdmin
      .from("wallets")
      .upsert({ user_id: userId, balance: 0 }, { onConflict: "user_id", ignoreDuplicates: true })

    // Try add_red_coins RPC first (from existing migration)
    const { error: rpcErr } = await supabaseAdmin.rpc("add_red_coins", {
      p_user_id: userId,
      p_coins: coins,
    })

    if (rpcErr) {
      // Direct increment fallback
      const { data: w } = await supabaseAdmin.from("wallets").select("balance").eq("user_id", userId).single()
      await supabaseAdmin.from("wallets").update({ balance: (w?.balance || 0) + coins }).eq("user_id", userId)
    }

    // Log as admin grant (price_usd = 0)
    await supabaseAdmin.from("coin_purchases").insert({
      user_id: userId,
      coins_amount: coins,
      price_usd: 0,
      stripe_payment_id: `ADMIN_GRANT_${Date.now()}`,
    })

    const { data: wallet } = await supabaseAdmin.from("wallets").select("balance").eq("user_id", userId).single()
    return NextResponse.json({ success: true, newBalance: wallet?.balance ?? coins })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Error" }, { status: 500 })
  }
}
