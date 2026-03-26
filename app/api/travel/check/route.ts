import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const getServiceClient = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

/* ── GET — auto-move listings based on today's date ── */
export async function GET() {
  try {
    const db = getServiceClient();
    const today = new Date().toISOString().split("T")[0];
    let moved = 0;

    // 1. Find entries where arrival_date = today AND is_current = false
    const { data: arriving } = await db
      .from("travel_schedule")
      .select("id, listing_id, country, city")
      .eq("arrival_date", today)
      .eq("is_current", false);

    if (arriving && arriving.length > 0) {
      for (const t of arriving) {
        // Get current listing location to save as original
        const { data: listing } = await db
          .from("listings")
          .select("country, city, original_country, original_city")
          .eq("id", t.listing_id)
          .single();

        if (!listing) continue;

        // Save original location if not already set
        const updates: Record<string, string> = {
          country: t.country,
          city: t.city,
        };
        if (!listing.original_country) updates.original_country = listing.country;
        if (!listing.original_city) updates.original_city = listing.city ?? "";

        await db.from("listings").update(updates).eq("id", t.listing_id);
        await db.from("travel_schedule").update({ is_current: true }).eq("id", t.id);
        moved++;
      }
    }

    // 2. Find entries where departure_date < today AND is_current = true
    const { data: departing } = await db
      .from("travel_schedule")
      .select("id, listing_id")
      .lt("departure_date", today)
      .eq("is_current", true);

    if (departing && departing.length > 0) {
      for (const t of departing) {
        const { data: listing } = await db
          .from("listings")
          .select("original_country, original_city")
          .eq("id", t.listing_id)
          .single();

        if (!listing) continue;

        // Restore original location
        await db
          .from("listings")
          .update({
            country: listing.original_country,
            city: listing.original_city,
          })
          .eq("id", t.listing_id);

        await db.from("travel_schedule").update({ is_current: false }).eq("id", t.id);
        moved++;
      }
    }

    return NextResponse.json({ moved });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
