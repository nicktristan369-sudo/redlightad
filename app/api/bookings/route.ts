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

    const { listing_id, rate_type, price_kr } = await req.json()
    if (!listing_id || !rate_type || !price_kr) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    }

    const supabase = db()
    const price_redcoins = Math.round(price_kr * 10)
    const commission = Math.round(price_redcoins * 0.19)
    const seller_receives = price_redcoins - commission

    // 1. Get buyer wallet
    const { data: buyerWallet } = await supabase
      .from("wallets")
      .select("balance")
      .eq("user_id", user.id)
      .single()

    if (!buyerWallet || buyerWallet.balance < price_redcoins) {
      return NextResponse.json({ error: "insufficient_coins" }, { status: 402 })
    }

    // 2. Get seller from listing
    const { data: listing } = await supabase
      .from("listings")
      .select("user_id")
      .eq("id", listing_id)
      .single()

    if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 })

    // 3. Deduct coins from buyer
    await supabase
      .from("wallets")
      .update({ balance: buyerWallet.balance - price_redcoins })
      .eq("user_id", user.id)

    // 4. Credit seller
    const { data: sellerWallet } = await supabase
      .from("wallets")
      .select("balance, total_earned")
      .eq("user_id", listing.user_id)
      .maybeSingle()

    if (sellerWallet) {
      await supabase.from("wallets").update({
        balance: sellerWallet.balance + seller_receives,
        total_earned: sellerWallet.total_earned + seller_receives,
      }).eq("user_id", listing.user_id)
    } else {
      await supabase.from("wallets").insert({
        user_id: listing.user_id,
        balance: seller_receives,
        total_earned: seller_receives,
      })
    }

    // 5. Insert booking
    const { data: booking } = await supabase
      .from("bookings")
      .insert({
        listing_id,
        buyer_id: user.id,
        rate_type,
        price_redcoins,
        commission,
        seller_receives,
        status: "completed",
      })
      .select("id")
      .single()

    // 6. Log transactions
    await supabase.from("coin_transactions").insert([
      { user_id: user.id, type: "spend", amount: -price_redcoins, reference_id: listing_id, note: "Booking betaling" },
      { user_id: listing.user_id, type: "earn", amount: seller_receives, reference_id: listing_id, note: "Booking indtjening (efter 19% kommission)" },
    ])

    return NextResponse.json({ ok: true, booking_id: booking?.id })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
