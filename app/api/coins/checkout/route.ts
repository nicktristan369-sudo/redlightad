import { NextRequest, NextResponse } from "next/server"
import { getStripe } from "@/lib/stripe"
import { COIN_PACKAGES } from "@/lib/coinPackages"

export async function POST(req: NextRequest) {
  try {
    const { packageId, userId } = await req.json()
    const pkg = COIN_PACKAGES.find(p => p.id === packageId)
    if (!pkg) return NextResponse.json({ error: "Invalid package" }, { status: 400 })

    const stripe = getStripe()
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency: "eur",
          product_data: {
            name: `${pkg.coins} RedCoins`,
            description: `${pkg.coins} coins til dit RedLightAd wallet`,
          },
          unit_amount: pkg.price_cents,
        },
        quantity: 1,
      }],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/wallet?coins_purchased=true&coins=${pkg.coins}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/buy-coins`,
      metadata: {
        user_id: userId,
        coins_amount: pkg.coins.toString(),
        package_id: packageId,
        price_eur: pkg.price_eur.toString(),
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
