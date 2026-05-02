import { NextRequest, NextResponse } from "next/server"
import { COIN_PACKAGES } from "@/lib/coinPackages"

export async function POST(req: NextRequest) {
  try {
    const { packageId, userId, customAmount, listingId, toUserId, type } = await req.json()

    const apiKey = process.env.NOWPAYMENTS_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "Crypto payment not configured" }, { status: 503 })
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://redlightad.com"

    // Custom tip betaling (Pay Me system)
    let priceEur: number
    let orderDescription: string
    let orderId: string
    let successUrl: string
    let cancelUrl: string

    if (type === "tip" && customAmount) {
      priceEur = parseFloat(customAmount)
      orderDescription = `Tip to profile on RedLightAD`
      orderId = `tip_${listingId}_${toUserId}_${Date.now()}`
      successUrl = `${siteUrl}/ads/${listingId}?tip_sent=true`
      cancelUrl = `${siteUrl}/ads/${listingId}`
    } else {
      // Standard coin pakke køb
      const pkg = COIN_PACKAGES.find(p => p.id === packageId)
      if (!pkg) return NextResponse.json({ error: "Invalid package" }, { status: 400 })
      priceEur = pkg.price_eur
      orderDescription = `${pkg.coins} RedCoins til RedLightAD`
      orderId = `redcoins_${packageId}_${userId}_${Date.now()}`
      successUrl = `${siteUrl}/dashboard/wallet?coins_purchased=true&coins=${pkg.coins}&user=${userId}`
      cancelUrl = `${siteUrl}/dashboard/buy-coins`
    }

    const res = await fetch("https://api.nowpayments.io/v1/invoice", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        price_amount: priceEur,
        price_currency: "eur",
        order_id: orderId,
        order_description: orderDescription,
        ipn_callback_url: `${siteUrl}/api/coins/nowpayments-webhook`,
        success_url: successUrl,
        cancel_url: cancelUrl,
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
