import { NextRequest, NextResponse } from "next/server"
import { PUSH_POINT_PACKAGES } from "@/lib/spendPackages"

export async function POST(req: NextRequest) {
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY
    if (!stripeKey) return NextResponse.json({ error: "Stripe not configured" }, { status: 500 })

    const { packageId, userId } = await req.json()
    if (!packageId || !userId) return NextResponse.json({ error: "Missing params" }, { status: 400 })

    const pkg = PUSH_POINT_PACKAGES.find(p => p.id === packageId)
    if (!pkg) return NextResponse.json({ error: "Invalid package" }, { status: 400 })

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://redlightad.com"

    const params = new URLSearchParams()
    params.append("payment_method_types[]", "card")
    params.append("mode", "payment")
    params.append("line_items[0][price_data][currency]", "eur")
    params.append("line_items[0][price_data][product_data][name]", `${pkg.points} Push Points — RedLightAD`)
    params.append("line_items[0][price_data][product_data][description]", `${pkg.points} pushes to move your profile to #1 instantly`)
    params.append("line_items[0][price_data][unit_amount]", String(Math.round(pkg.price_usd * 100)))
    params.append("line_items[0][quantity]", "1")
    params.append("metadata[packageId]", packageId)
    params.append("metadata[userId]", userId)
    params.append("metadata[points]", String(pkg.points))
    params.append("metadata[type]", "push_points")
    params.append("success_url", `${baseUrl}/dashboard?points_purchased=true&points=${pkg.points}&user=${userId}`)
    params.append("cancel_url", `${baseUrl}/dashboard`)

    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    })

    const data = await res.json()
    if (!res.ok) return NextResponse.json({ error: data.error?.message || "Stripe error" }, { status: res.status })

    return NextResponse.json({ url: data.url })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
