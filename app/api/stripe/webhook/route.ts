import { NextRequest, NextResponse } from "next/server"
import { getStripe } from "@/lib/stripe"
import { createServerClient } from "@/lib/supabaseServer"
import Stripe from "stripe"

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get("stripe-signature")!
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

  if (!webhookSecret) {
    console.error("[Webhook] STRIPE_WEBHOOK_SECRET not configured")
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 })
  }

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(body, sig, webhookSecret)
    console.log(`[Webhook] Event received: ${event.type}`)
  } catch (err) {
    console.error("[Webhook] Invalid signature:", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session
    const { tier, listing_id, type, userId, points } = session.metadata || {}

    const supabase = createServerClient()

    // Handle push points purchase
    if (type === "push_points" && userId && points) {
      const pointsAmount = parseInt(points)
      
      // Get current balance
      const { data: wallet, error: walletErr } = await supabase
        .from("wallets")
        .select("push_points")
        .eq("user_id", userId)
        .single()

      if (walletErr) {
        console.error("[Webhook] Wallet fetch error:", walletErr)
        return NextResponse.json({ error: "Wallet fetch failed" }, { status: 500 })
      }

      const current = wallet?.push_points ?? 0

      // Update wallet
      const { error: updateErr } = await supabase
        .from("wallets")
        .upsert({ user_id: userId, push_points: current + pointsAmount }, { onConflict: "user_id" })
      
      if (updateErr) {
        console.error("[Webhook] Wallet update error:", updateErr)
        return NextResponse.json({ error: "Wallet update failed" }, { status: 500 })
      }

      // Log purchase
      const { error: logErr } = await supabase.from("push_point_purchases").insert({
        user_id: userId,
        stripe_session_id: session.id,
        points_bought: pointsAmount,
        price_usd: (session.amount_total || 0) / 100,
      })
      
      if (logErr) {
        console.error("[Webhook] Purchase log error:", logErr)
      }

      console.log(`[Webhook] Push points added: ${pointsAmount} to user ${userId}`)
      return NextResponse.json({ received: true })
    }

    // Handle tier/premium purchase
    if (!tier) return NextResponse.json({ received: true })

    const premiumUntil = new Date()
    premiumUntil.setDate(premiumUntil.getDate() + 30)

    // Save order
    await supabase.from("orders").insert({
      stripe_session_id: session.id,
      listing_id: listing_id || null,
      tier,
      amount: session.amount_total || 0,
      status: "completed",
    })

    // Update listing if provided
    if (listing_id) {
      await supabase
        .from("listings")
        .update({
          premium_tier: tier,
          premium_until: premiumUntil.toISOString(),
          status: "active",
        })
        .eq("id", listing_id)
    }
  }

  return NextResponse.json({ received: true })
}
