import { NextRequest, NextResponse } from "next/server"
import { getStripe } from "@/lib/stripe"
import { createServerClient } from "@/lib/supabaseServer"

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get("stripe-signature")!
  const webhookSecret = process.env.STRIPE_COINS_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET!

  let event
  try {
    const stripe = getStripe()
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch {
    return NextResponse.json({ error: "Webhook signature failed" }, { status: 400 })
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as { metadata?: Record<string, string>; payment_intent?: string | { id: string } }
    const meta = session.metadata
    if (!meta?.user_id || !meta?.coins_amount) return NextResponse.json({ ok: true })

    const supabase = createServerClient()
    const userId = meta.user_id
    const coinsAmount = parseInt(meta.coins_amount)
    const priceUsd = parseFloat(meta.price_eur || meta.price_usd || "0")
    const paymentId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id || ""

    // Upsert wallet
    const { data: wallet } = await supabase
      .from("wallets")
      .select("balance")
      .eq("user_id", userId)
      .single()

    if (wallet) {
      await supabase.from("wallets").update({ balance: wallet.balance + coinsAmount }).eq("user_id", userId)
    } else {
      await supabase.from("wallets").insert({ user_id: userId, balance: coinsAmount })
    }

    // Log purchase
    await supabase.from("coin_purchases").insert({ user_id: userId, coins_amount: coinsAmount, price_usd: priceUsd, stripe_payment_id: paymentId })

    // Log transaction
    await supabase.from("coin_transactions").insert({ user_id: userId, type: "purchase", amount: coinsAmount, note: `Purchased coins` })
  }

  return NextResponse.json({ ok: true })
}
