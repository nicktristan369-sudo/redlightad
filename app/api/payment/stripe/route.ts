import { NextRequest, NextResponse } from "next/server";

// DKK amounts per plan/duration (matches choose-plan page pricing)
// Standard: 150 DKK/mo, Premium: 300 DKK/mo
// Discounts: 1mo=25%, 3mo=30%, 6mo=40%, 12mo=50%
const PLAN_LABELS: Record<string, string> = {
  standard: "Standard Profile",
  premium: "Premium Profile",
};

export async function POST(req: NextRequest) {
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
    }

    const { plan, months, amount, userId } = await req.json();

    if (!plan || !months || !amount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://redlightad.com";
    const planLabel = PLAN_LABELS[plan] || plan;
    const monthLabel = months === 1 ? "1 Month" : `${months} Months`;

    // Build Stripe Checkout session via REST API
    const params = new URLSearchParams();
    params.append("payment_method_types[]", "card");
    params.append("mode", "payment");
    params.append("line_items[0][price_data][currency]", "dkk");
    params.append("line_items[0][price_data][product_data][name]", `RedLightAD ${planLabel} — ${monthLabel}`);
    params.append("line_items[0][price_data][product_data][description]", `RedLightAD ${planLabel} subscription for ${monthLabel}`);
    params.append("line_items[0][price_data][unit_amount]", String(amount * 100)); // øre
    params.append("line_items[0][quantity]", "1");
    params.append("metadata[plan]", plan);
    params.append("metadata[months]", String(months));
    params.append("metadata[userId]", userId || "");
    params.append("success_url", `${baseUrl}/dashboard?plan_activated=true&plan=${plan}&months=${months}`);
    params.append("cancel_url", `${baseUrl}/choose-plan`);

    const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Stripe API error:", data.error?.message);
      return NextResponse.json(
        { error: data.error?.message || "Stripe error" },
        { status: response.status }
      );
    }

    return NextResponse.json({ url: data.url });
  } catch (e) {
    console.error("Stripe route error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
