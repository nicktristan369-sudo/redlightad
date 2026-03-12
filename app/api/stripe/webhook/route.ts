import { NextRequest, NextResponse } from "next/server"
import { getStripe } from "@/lib/stripe"
import { createServerClient } from "@/lib/supabaseServer"
import Stripe from "stripe"

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get("stripe-signature")!
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(body, sig, webhookSecret)
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session
    const { tier, listing_id } = session.metadata || {}

    if (!tier) return NextResponse.json({ received: true })

    const supabase = createServerClient()
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
