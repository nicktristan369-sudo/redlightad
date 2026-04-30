import { NextRequest, NextResponse } from "next/server"

const POINT_PACKAGES = [
  { id: "points_1m",  points: 50,  price_eur: 4.99  },
  { id: "points_3m",  points: 175, price_eur: 12.99 },
  { id: "points_6m",  points: 400, price_eur: 24.99 },
  { id: "points_12m", points: 900, price_eur: 44.99 },
]

export async function POST(req: NextRequest) {
  try {
    const { packageId, userId } = await req.json()

    const pkg = POINT_PACKAGES.find(p => p.id === packageId)
    if (!pkg) return NextResponse.json({ error: "Invalid package" }, { status: 400 })

    const apiKey = process.env.NOWPAYMENTS_API_KEY
    if (!apiKey) return NextResponse.json({ error: "Crypto payment not configured" }, { status: 503 })

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://redlightad.com"
    const orderId = `points_${packageId}_${userId}_${Date.now()}`

    const res = await fetch("https://api.nowpayments.io/v1/invoice", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        price_amount: pkg.price_eur,
        price_currency: "eur",
        order_id: orderId,
        order_description: `${pkg.points} Push-to-Top points på RedLightAD`,
        ipn_callback_url: `${siteUrl}/api/points/webhook`,
        success_url: `${siteUrl}/dashboard/boost?points_purchased=true&points=${pkg.points}&user=${userId}`,
        cancel_url: `${siteUrl}/dashboard/buy-points`,
      }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      return NextResponse.json({ error: err?.message || "Payment error" }, { status: 500 })
    }

    const data = await res.json()
    return NextResponse.json({ url: data.invoice_url })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
