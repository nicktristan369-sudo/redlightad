import { NextRequest, NextResponse } from "next/server"
import { COIN_PACKAGES } from "@/lib/coinPackages"

export async function POST(req: NextRequest) {
  try {
    const { packageId, userId } = await req.json()
    const pkg = COIN_PACKAGES.find(p => p.id === packageId)
    if (!pkg) return NextResponse.json({ error: "Invalid package" }, { status: 400 })

    const apiKey = process.env.COINBASE_COMMERCE_API_KEY
    if (!apiKey) return NextResponse.json({ error: "Crypto payments not configured" }, { status: 503 })

    const res = await fetch("https://api.commerce.coinbase.com/charges", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CC-Api-Key": apiKey,
        "X-CC-Version": "2018-03-22",
      },
      body: JSON.stringify({
        name: `${pkg.coins} RedCoins`,
        description: `${pkg.coins} RedCoins til RedLightAD`,
        pricing_type: "fixed_price",
        local_price: { amount: pkg.price_eur.toString(), currency: "EUR" },
        metadata: {
          user_id: userId,
          coins_amount: pkg.coins.toString(),
          package_id: packageId,
        },
        redirect_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/wallet?coins_purchased=true&coins=${pkg.coins}`,
        cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/buy-coins`,
      }),
    })

    if (!res.ok) {
      const err = await res.json()
      return NextResponse.json({ error: err.error?.message || "Coinbase error" }, { status: 500 })
    }

    const data = await res.json()
    return NextResponse.json({ url: data.data.hosted_url })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
