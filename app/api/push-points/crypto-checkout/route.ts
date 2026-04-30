import { NextRequest, NextResponse } from "next/server"
import { PUSH_POINT_PACKAGES } from "@/lib/spendPackages"

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.NOWPAYMENTS_API_KEY
    if (!apiKey) return NextResponse.json({ error: "Crypto payment not configured" }, { status: 503 })

    const { packageId, userId } = await req.json()
    if (!packageId || !userId) return NextResponse.json({ error: "Missing params" }, { status: 400 })

    const pkg = PUSH_POINT_PACKAGES.find(p => p.id === packageId)
    if (!pkg) return NextResponse.json({ error: "Invalid package" }, { status: 400 })

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://redlightad.com"
    const orderId = `pushpts_${packageId}_${userId}_${Date.now()}`

    const res = await fetch("https://api.nowpayments.io/v1/invoice", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        price_amount: pkg.price_usd,
        price_currency: "eur",
        order_id: orderId,
        order_description: `${pkg.points} Push Points på RedLightAD`,
        ipn_callback_url: `${siteUrl}/api/push-points/webhook`,
        success_url: `${siteUrl}/dashboard?points_purchased=true&points=${pkg.points}&user=${userId}`,
        cancel_url: `${siteUrl}/dashboard`,
      }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      return NextResponse.json({ error: err?.message || "Crypto payment error" }, { status: 500 })
    }

    const data = await res.json()
    return NextResponse.json({ url: data.invoice_url })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
