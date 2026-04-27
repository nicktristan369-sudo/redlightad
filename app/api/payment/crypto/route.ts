import { NextRequest, NextResponse } from "next/server";

// DKK to EUR conversion (approximate, for NowPayments)
const DKK_TO_EUR = 0.134;

export async function POST(req: NextRequest) {
  try {
    const { plan, months, amount, userId } = await req.json();

    if (!plan || !months || !amount || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const apiKey = process.env.NOWPAYMENTS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Crypto payment not configured" }, { status: 503 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://redlightad.com";
    const orderId = `plan_${plan}_${userId}_${Date.now()}`;
    const monthLabel = months === 1 ? "1 Month" : `${months} Months`;
    const planLabel = plan === "premium" ? "Premium" : "Standard";
    const amountEur = Math.round(amount * DKK_TO_EUR * 100) / 100;

    const res = await fetch("https://api.nowpayments.io/v1/invoice", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        price_amount: amountEur,
        price_currency: "eur",
        order_id: orderId,
        order_description: `RedLightAD ${planLabel} Profile — ${monthLabel}`,
        ipn_callback_url: `${siteUrl}/api/payments/plan-webhook`,
        success_url: `${siteUrl}/dashboard?plan_activated=true&plan=${plan}&months=${months}`,
        cancel_url: `${siteUrl}/choose-plan`,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json({ error: err?.message || "Crypto payment error" }, { status: 500 });
    }

    const data = await res.json();
    return NextResponse.json({ payment_url: data.invoice_url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
