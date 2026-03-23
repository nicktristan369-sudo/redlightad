import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";

const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

// Auth client (respects user session via cookies)
async function getAuthClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
      },
    }
  );
}

// Service client (bypasses RLS for DB writes)
const getServiceClient = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authClient = await getAuthClient();
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) return NextResponse.json({ error: "Ikke autoriseret" }, { status: 401 });

    const db = getServiceClient();

    // Verify ownership + get current state
    const { data: listing, error: lErr } = await db
      .from("listings")
      .select("id, user_id, premium_tier, location_changed_at")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (lErr || !listing) {
      return NextResponse.json({ error: "Annonce ikke fundet" }, { status: 404 });
    }

    // Check profile tier too
    const { data: profile } = await db
      .from("profiles")
      .select("subscription_tier")
      .eq("id", user.id)
      .single();

    const tier = profile?.subscription_tier || listing.premium_tier;
    const isPremium = ["basic", "featured", "vip"].includes(tier ?? "");
    if (!isPremium) {
      return NextResponse.json({ error: "Premium krævet" }, { status: 403 });
    }

    // Check 24h cooldown
    if (listing.location_changed_at) {
      const lastChange = new Date(listing.location_changed_at).getTime();
      const elapsed = Date.now() - lastChange;
      if (elapsed < COOLDOWN_MS) {
        return NextResponse.json({
          error: "cooldown",
          remaining_ms: COOLDOWN_MS - elapsed,
        }, { status: 429 });
      }
    }

    const body = await req.json() as { country: string; city: string };
    const { country, city } = body;
    if (!country || !city) {
      return NextResponse.json({ error: "country og city er påkrævet" }, { status: 400 });
    }

    const { error: updateErr } = await db
      .from("listings")
      .update({
        country,
        city,
        location: city,
        location_changed_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id);

    if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
