import { NextRequest, NextResponse } from "next/server"
import { COIN_PACKAGES } from "@/lib/coinPackages"

export async function POST(req: NextRequest) {
  try {
    const { packageId, userId } = await req.json()
    const pkg = COIN_PACKAGES.find(p => p.id === packageId)
    if (!pkg) return NextResponse.json({ error: "Invalid package" }, { status: 400 })

    const apiKey = process.env.NOWPAYMENTS_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "Crypto betaling ikke konfigureret" }, { status: 503 })
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://redlightad.com"
    const orderId = `redcoins_${packageId}_${userId}_${Date.now()}`

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
        order_description: `${pkg.coins} RedCoins til RedLightAD`,
        ipn_callback_url: `${siteUrl}/api/coins/nowpayments-webhook`,
        success_url: `${siteUrl}/dashboard/wallet?coins_purchased=true&coins=${pkg.coins}&user=${userId}`,
        cancel_url: `${siteUrl}/dashboard/buy-coins`,
      }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      const msg = err?.message || `NOWPayments fejl (${res.status})`
      return NextResponse.json({ error: msg }, { status: 500 })
    }

    const data = await res.json()
    return NextResponse.json({ url: data.invoice_url })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
