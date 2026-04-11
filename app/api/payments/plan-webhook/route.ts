import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { createClient } from "@supabase/supabase-js";

// Helper to get admin client (lazy factory pattern)
let adminClient: ReturnType<typeof createClient> | null = null;
function getAdmin() {
  if (!adminClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return adminClient;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get("x-nowpayments-sig");
    const ipnSecret = process.env.NOWPAYMENTS_IPN_SECRET;

    // Verify signature if IPN secret is configured
    if (ipnSecret && signature) {
      const hmac = createHmac("sha512", ipnSecret);
      const sortedBody = JSON.stringify(JSON.parse(body), Object.keys(JSON.parse(body)).sort());
      hmac.update(sortedBody);
      const expected = hmac.digest("hex");
      if (expected !== signature) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    const data = JSON.parse(body);
    const { payment_status, order_id } = data;

    // Only process confirmed payments
    if (payment_status !== "finished" && payment_status !== "confirmed") {
      return NextResponse.json({ ok: true });
    }

    // Parse order_id: format = "plan_{planId}_{userId}_{timestamp}"
    const parts = order_id?.split("_");
    if (!parts || parts.length < 4) {
      return NextResponse.json({ error: "Invalid order_id" }, { status: 400 });
    }

    const planId = parts[1]; // "basic" or "vip"
    const userId = parts[2];

    if (!planId || !userId) {
      return NextResponse.json({ error: "Invalid plan or user" }, { status: 400 });
    }

    const supabase = getAdmin();

    // Get user's listing
    const { data: listing, error: listingError } = await supabase
      .from("listings")
      .select("id")
      .eq("user_id", userId)
      .limit(1)
      .single() as { data: { id: string } | null; error: any };

    if (listingError || !listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    // Update listing with new plan
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase as any)
      .from("listings")
      .update({ premium_tier: planId, status: "active" })
      .eq("id", listing.id);

    if (updateError) {
      console.error("Update listing error:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Log the plan purchase (if table exists)
    try {
      await (supabase.from("plan_purchases").insert({
        user_id: userId,
        listing_id: listing.id,
        plan_id: planId,
        payment_provider: "nowpayments",
        payment_id: data.payment_id?.toString(),
        status: "completed",
      } as any) as any);
    } catch (err) {
      // Table might not exist yet - that's okay, the main update succeeded
      console.log("Note: plan_purchases table not found (optional)");
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Plan webhook error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
