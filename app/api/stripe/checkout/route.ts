import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { PLANS } from "@/lib/plans"

export async function POST(req: NextRequest) {
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY

    // Debug: log key presence (never log the full key)
    if (!stripeKey) {
      console.error("STRIPE_SECRET_KEY is missing from env vars")
      return NextResponse.json(
        { error: "Stripe is not configured (missing secret key)" },
        { status: 500 }
      )
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2025-02-24.acacia",
    })

    const { tier, listingId } = await req.json()

    if (!["basic", "featured", "vip"].includes(tier)) {
      return NextResponse.json({ error: "Invalid tier" }, { status: 400 })
    }

    const plan = PLANS[tier as keyof typeof PLANS]
    const baseUrl = "https://redlightad.com"

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `RedLightAD ${plan.name} — 30 dage`,
              description: plan.features.join(" • "),
            },
            unit_amount: plan.price,
          },
          quantity: 1,
        },
      ],
      metadata: {
        tier,
        listing_id: listingId || "",
      },
      success_url: `${baseUrl}/dashboard?upgraded=true&tier=${tier}`,
      cancel_url: `${baseUrl}/premium`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Server error"
    console.error("Stripe checkout error:", msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
