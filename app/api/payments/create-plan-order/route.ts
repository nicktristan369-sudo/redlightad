import { NextRequest, NextResponse } from "next/server";

const DURATION_PRICES: Record<string, Record<number, number>> = {
  basic: { 1: 29, 3: 69, 6: 119, 12: 199 },
  vip:   { 1: 79, 3: 189, 6: 319, 12: 529 },
};

export async function POST(req: NextRequest) {
  try {
    const { plan, userId, months = 1, amount } = await req.json();

    if (!plan || !userId) {
      return NextResponse.json({ error: "Missing plan or userId" }, { status: 400 });
    }

    const priceEur = amount || DURATION_PRICES[plan]?.[months] || DURATION_PRICES[plan]?.[1];
    if (!priceEur) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const apiKey = process.env.NOWPAYMENTS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Payment system not configured" }, { status: 503 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://redlightad.com";
    const orderId = `plan_${plan}_${userId}_${Date.now()}`;
    const monthLabel = months === 1 ? "1 Month" : `${months} Months`;
    const orderDescription = `RedLightAD ${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan — ${monthLabel}`;

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
        ipn_callback_url: `${siteUrl}/api/payments/plan-webhook`,
        success_url: `${siteUrl}/dashboard?plan_activated=true&plan=${plan}`,
        cancel_url: `${siteUrl}/choose-plan/payment?plan=${plan}`,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const msg = err?.message || `NOWPayments error (${res.status})`;
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    const data = await res.json();
    return NextResponse.json({ url: data.invoice_url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
