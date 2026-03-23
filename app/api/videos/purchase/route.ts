import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabaseServer"

export async function POST(req: NextRequest) {
  try {
    const { videoId, buyerId } = await req.json()
    const supabase = createServerClient()

    // Get video with price
    const { data: video } = await supabase
      .from("listing_videos")
      .select("id, redcoin_price, listing_id")
      .eq("id", videoId)
      .single()

    if (!video) return NextResponse.json({ error: "Video not found" }, { status: 404 })

    // Find seller via listing
    const { data: listing } = await supabase
      .from("listings")
      .select("user_id")
      .eq("id", video.listing_id)
      .single()

    if (!listing) return NextResponse.json({ error: "Listing not found" }, { status: 404 })

    const sellerId = listing.user_id

    // Check buyer wallet
    const { data: wallet } = await supabase
      .from("wallets")
      .select("balance")
      .eq("user_id", buyerId)
      .single()

    if (!wallet || wallet.balance < video.redcoin_price) {
      return NextResponse.json({ error: "insufficient_coins" }, { status: 402 })
    }

    // Check if already purchased
    const { data: existing } = await supabase
      .from("video_purchases")
      .select("id")
      .eq("buyer_id", buyerId)
      .eq("video_id", videoId)
      .maybeSingle()

    if (existing) return NextResponse.json({ error: "already_purchased" }, { status: 409 })

    // Deduct coins from buyer
    await supabase.from("wallets")
      .update({ balance: wallet.balance - video.redcoin_price })
      .eq("user_id", buyerId)

    // Add coins to seller
    const { data: sellerWallet } = await supabase
      .from("wallets")
      .select("balance, total_earned")
      .eq("user_id", sellerId)
      .maybeSingle()

    if (sellerWallet) {
      await supabase.from("wallets").update({
        balance: sellerWallet.balance + video.redcoin_price,
        total_earned: sellerWallet.total_earned + video.redcoin_price,
      }).eq("user_id", sellerId)
    } else {
      await supabase.from("wallets").insert({
        user_id: sellerId,
        balance: video.redcoin_price,
        total_earned: video.redcoin_price,
      })
    }

    // Record purchase
    await supabase.from("video_purchases").insert({
      buyer_id: buyerId,
      video_id: videoId,
      coins_paid: video.redcoin_price,
    })

    // Log transactions
    await supabase.from("coin_transactions").insert([
      { user_id: buyerId, type: "spend", amount: -video.redcoin_price, reference_id: videoId, note: "Lås op for video" },
      { user_id: sellerId, type: "earn", amount: video.redcoin_price, reference_id: videoId, note: "Videosalg" },
    ])

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
