import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"

async function getAuthClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  )
}

const db = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

export async function POST(req: NextRequest) {
  try {
    const authClient = await getAuthClient()
    const { data: { user } } = await authClient.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { item_id } = await req.json()
    const supabase = db()

    // 1. Get item
    const { data: item } = await supabase
      .from("marketplace_items")
      .select("id, price_redcoins, listing_id, is_available")
      .eq("id", item_id)
      .single()

    if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 })
    if (!item.is_available) return NextResponse.json({ error: "Item not available" }, { status: 400 })

    // 2. Get buyer wallet
    const { data: buyerWallet } = await supabase
      .from("wallets")
      .select("balance")
      .eq("user_id", user.id)
      .single()

    // 3. Check buyer has enough coins
    if (!buyerWallet || buyerWallet.balance < item.price_redcoins) {
      return NextResponse.json({ error: "insufficient_coins" }, { status: 402 })
    }

    // 4. Check not already purchased
    const { data: existing } = await supabase
      .from("marketplace_purchases")
      .select("id")
      .eq("buyer_id", user.id)
      .eq("item_id", item_id)
      .maybeSingle()

    if (existing) return NextResponse.json({ error: "already_purchased" }, { status: 409 })

    // 5. Deduct coins from buyer
    await supabase
      .from("wallets")
      .update({ balance: buyerWallet.balance - item.price_redcoins })
      .eq("user_id", user.id)

    // 6. Calculate commission (19%)
    const commission = Math.round(item.price_redcoins * 0.19)
    const sellerReceives = item.price_redcoins - commission

    // 7. Get seller user_id from listing
    const { data: listing } = await supabase
      .from("listings")
      .select("user_id")
      .eq("id", item.listing_id)
      .single()

    if (!listing) return NextResponse.json({ error: "Seller not found" }, { status: 500 })

    // 8. Credit seller
    const { data: sellerWallet } = await supabase
      .from("wallets")
      .select("balance, total_earned")
      .eq("user_id", listing.user_id)
      .maybeSingle()

    if (sellerWallet) {
      await supabase.from("wallets").update({
        balance: sellerWallet.balance + sellerReceives,
        total_earned: sellerWallet.total_earned + sellerReceives,
      }).eq("user_id", listing.user_id)
    } else {
      await supabase.from("wallets").insert({
        user_id: listing.user_id,
        balance: sellerReceives,
        total_earned: sellerReceives,
      })
    }

    // 9. Record purchase
    await supabase.from("marketplace_purchases").insert({
      item_id,
      buyer_id: user.id,
      seller_listing_id: item.listing_id,
      price_redcoins: item.price_redcoins,
      commission,
      seller_receives: sellerReceives,
    })

    // 10. Log transactions
    await supabase.from("coin_transactions").insert([
      { user_id: user.id, type: "spend", amount: -item.price_redcoins, reference_id: item_id, note: "Marketplace purchase" },
      { user_id: listing.user_id, type: "earn", amount: sellerReceives, reference_id: item_id, note: "Marketplace salg (efter 19% kommission)" },
    ])

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
