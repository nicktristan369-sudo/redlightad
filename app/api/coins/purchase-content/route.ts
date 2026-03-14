import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabaseServer"

export async function POST(req: NextRequest) {
  try {
    const { contentId, buyerId } = await req.json()
    const supabase = createServerClient()

    // Get content price
    const { data: content } = await supabase
      .from("locked_content")
      .select("id, coin_price, seller_id")
      .eq("id", contentId)
      .single()

    if (!content) return NextResponse.json({ error: "Content not found" }, { status: 404 })

    // Check buyer wallet
    const { data: wallet } = await supabase
      .from("wallets")
      .select("balance")
      .eq("user_id", buyerId)
      .single()

    if (!wallet || wallet.balance < content.coin_price) {
      return NextResponse.json({ error: "insufficient_coins" }, { status: 402 })
    }

    // Check if already purchased
    const { data: existing } = await supabase
      .from("content_purchases")
      .select("id")
      .eq("buyer_id", buyerId)
      .eq("content_id", contentId)
      .maybeSingle()

    if (existing) return NextResponse.json({ error: "already_purchased" }, { status: 409 })

    // Deduct coins from buyer
    await supabase.from("wallets")
      .update({ balance: wallet.balance - content.coin_price })
      .eq("user_id", buyerId)

    // Add coins to seller
    const { data: sellerWallet } = await supabase
      .from("wallets")
      .select("balance, total_earned")
      .eq("user_id", content.seller_id)
      .maybeSingle()

    if (sellerWallet) {
      await supabase.from("wallets").update({
        balance: sellerWallet.balance + content.coin_price,
        total_earned: sellerWallet.total_earned + content.coin_price,
      }).eq("user_id", content.seller_id)
    } else {
      await supabase.from("wallets").insert({
        user_id: content.seller_id,
        balance: content.coin_price,
        total_earned: content.coin_price,
      })
    }

    // Record purchase
    await supabase.from("content_purchases").insert({
      buyer_id: buyerId,
      content_id: contentId,
      coins_paid: content.coin_price,
    })

    // Log transactions
    await supabase.from("coin_transactions").insert([
      { user_id: buyerId, type: "spend", amount: -content.coin_price, reference_id: contentId, note: "Låst op for eksklusivt indhold" },
      { user_id: content.seller_id, type: "earn", amount: content.coin_price, reference_id: contentId, note: "Salg af eksklusivt indhold" },
    ])

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
