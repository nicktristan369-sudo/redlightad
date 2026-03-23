import { NextRequest, NextResponse } from "next/server"
import { PLANS } from "@/lib/plans"

export async function POST(req: NextRequest) {
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY
    if (!stripeKey) {
      return NextResponse.json(
        { error: "Stripe ikke konfigureret" },
        { status: 500 }
      )
    }

    const { tier, listingId } = await req.json()
    if (!["basic", "featured", "vip"].includes(tier)) {
      return NextResponse.json({ error: "Ugyldig pakke" }, { status: 400 })
    }

    const plan = PLANS[tier as keyof typeof PLANS]
    const baseUrl = "https://redlightad.com"

    // Build Stripe Checkout session via REST API directly (avoids SDK network issues)
    const params = new URLSearchParams()
    params.append("payment_method_types[]", "card")
    params.append("mode", "payment")
    params.append("line_items[0][price_data][currency]", "usd")
    params.append("line_items[0][price_data][product_data][name]", `RedLightAD ${plan.name} — 30 dage`)
    params.append("line_items[0][price_data][unit_amount]", String(plan.price))
    params.append("line_items[0][quantity]", "1")
    params.append("metadata[tier]", tier)
    params.append("metadata[listing_id]", listingId || "")
    params.append("success_url", `${baseUrl}/dashboard?upgraded=true&tier=${tier}`)
    params.append("cancel_url", `${baseUrl}/upgrade`)

    const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error("Stripe API error:", data.error?.message)
      return NextResponse.json(
        { error: data.error?.message || "Stripe fejl" },
        { status: response.status }
      )
    }

    return NextResponse.json({ url: data.url })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Server fejl"
    console.error("Checkout route error:", msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
