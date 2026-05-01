import { NextRequest, NextResponse } from "next/server"
import { createHmac } from "crypto"
import { createServerClient } from "@/lib/supabaseServer"

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const signature = req.headers.get("x-nowpayments-sig")
    const ipnSecret = process.env.NOWPAYMENTS_IPN_SECRET

    // Verificer signatur hvis IPN secret er konfigureret
    if (ipnSecret && signature) {
      const hmac = createHmac("sha512", ipnSecret)
      const sortedBody = JSON.stringify(JSON.parse(body), Object.keys(JSON.parse(body)).sort())
      hmac.update(sortedBody)
      const expected = hmac.digest("hex")
      if (expected !== signature) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
      }
    }

    const data = JSON.parse(body)
    const { payment_status, order_id } = data

    // Kun behandl bekræftede betalinger
    if (payment_status !== "finished" && payment_status !== "confirmed") {
      return NextResponse.json({ ok: true })
    }

    // Parse order_id: format = "redcoins_{packageId}_{userId}_{timestamp}"
    const parts = order_id?.split("_")
    if (!parts || parts.length < 4) {
      return NextResponse.json({ error: "Invalid order_id" }, { status: 400 })
    }

    const packageId = `${parts[1]}_${parts[2]}` // f.eks. "coins_600"
    const userId = parts[3]

    // Hent antal coins fra packageId
    const coinsMap: Record<string, number> = {
      "coins_100": 100,
      "coins_300": 300,
      "coins_600": 600,
      "coins_1200": 1200,
      "coins_2500": 2500,
      "coins_5000": 5000,
    }
    const coins = coinsMap[packageId]
    if (!coins || !userId) {
      return NextResponse.json({ error: "Invalid package or user" }, { status: 400 })
    }

    const supabase = createServerClient()

    // Tilføj coins til brugerens wallet
    const { error } = await supabase.rpc("add_red_coins", {
      p_user_id: userId,
      p_coins: coins,
    })

    if (error) {
      console.error("add_red_coins fejl:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Log købet
    await supabase.from("coin_purchases").insert({
      user_id: userId,
      package_id: packageId,
      coins_amount: coins,
      payment_provider: "nowpayments",
      payment_id: data.payment_id?.toString(),
      status: "completed",
    })

    // Log til crypto_payments for admin oversigt
    try {
      await supabase.from("crypto_payments").insert({
        payment_id: data.payment_id?.toString(),
        order_id: order_id,
        user_id: userId,
        payment_type: "coins",
        status: payment_status,
        pay_amount: data.pay_amount,
        pay_currency: data.pay_currency,
        price_amount: data.price_amount,
        price_currency: data.price_currency,
        actually_paid: data.actually_paid,
        outcome_amount: data.outcome_amount,
        outcome_currency: data.outcome_currency,
      })
    } catch { /* table might not exist yet */ }

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
