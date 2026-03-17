import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Map full country name → possible DB values (code variants + full name)
// Listings may be stored as "DK", "dk", "Denmark" etc.
const COUNTRY_ALIASES: Record<string, string[]> = {
  "denmark":        ["denmark", "dk", "DK", "Danmark"],
  "sweden":         ["sweden", "se", "SE", "Sverige"],
  "norway":         ["norway", "no", "NO", "Norge"],
  "finland":        ["finland", "fi", "FI"],
  "germany":        ["germany", "de", "DE", "Deutschland"],
  "netherlands":    ["netherlands", "nl", "NL"],
  "united kingdom": ["united kingdom", "gb", "GB", "uk", "UK"],
  "france":         ["france", "fr", "FR"],
  "spain":          ["spain", "es", "ES"],
  "italy":          ["italy", "it", "IT"],
  "switzerland":    ["switzerland", "ch", "CH"],
  "austria":        ["austria", "at", "AT"],
  "belgium":        ["belgium", "be", "BE"],
  "poland":         ["poland", "pl", "PL"],
  "thailand":       ["thailand", "th", "TH"],
  "uae":            ["uae", "ae", "AE", "United Arab Emirates"],
  "singapore":      ["singapore", "sg", "SG"],
  "japan":          ["japan", "jp", "JP"],
  "usa":            ["usa", "us", "US", "United States"],
  "canada":         ["canada", "ca", "CA"],
  "australia":      ["australia", "au", "AU"],
};

function getCountryFilter(name: string): string {
  const aliases = COUNTRY_ALIASES[name.toLowerCase()];
  if (aliases && aliases.length > 0) {
    return aliases.map(a => `country.eq.${a}`).join(",");
  }
  // Fallback: exact match + uppercase code
  return `country.eq.${name},country.eq.${name.toUpperCase().slice(0, 2)}`;
}

export const dynamic = "force-dynamic";

const getClient = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status  = searchParams.get("status");  // pending | active | rejected | all
    const country = searchParams.get("country"); // optional country filter

    const supabase = getClient();

    let query = supabase
      .from("listings")
      .select("id, title, category, gender, age, country, city, status, created_at, profile_image, user_id, premium_tier")
      .order("created_at", { ascending: false });

    if (status && status !== "all") query = query.eq("status", status);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (country && country !== "all") query = (query as any).or(getCountryFilter(country));

    const { data: listings, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!listings || listings.length === 0) return NextResponse.json({ listings: [] });

    const userIds = [...new Set(listings.map((l: Record<string, unknown>) => l.user_id as string))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", userIds);

    const profileMap = Object.fromEntries(
      (profiles ?? []).map((p: { id: string; full_name?: string; email?: string }) => [
        p.id,
        { full_name: p.full_name ?? null, email: p.email ?? null },
      ])
    );

    const enriched = listings.map((l: Record<string, unknown>) => ({
      ...l,
      tier:        (l.premium_tier as string | null),
      in_carousel: false, // default until migration 20260317010000_in_carousel.sql is applied
      user_name:   profileMap[l.user_id as string]?.full_name ?? null,
      user_email:  profileMap[l.user_id as string]?.email ?? null,
    }));

    return NextResponse.json({ listings: enriched });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      listingId: string;
      action: "approve" | "reject" | "delete" | "set_tier" | "set_carousel";
      tier?: string | null;
      in_carousel?: boolean;
    };
    const { listingId, action, tier, in_carousel } = body;

    if (!listingId || !["approve", "reject", "delete", "set_tier", "set_carousel"].includes(action)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const supabase = getClient();

    if (action === "delete") {
      const { error } = await supabase.from("listings").delete().eq("id", listingId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    if (action === "set_carousel") {
      const { error } = await supabase
        .from("listings")
        .update({ in_carousel: in_carousel ?? false })
        .eq("id", listingId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    if (action === "set_tier") {
      const newTier = tier ?? null;
      const allowed = [null, "basic", "featured", "vip"];
      if (!allowed.includes(newTier)) {
        return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
      }
      const { error } = await supabase
        .from("listings")
        .update({ premium_tier: newTier })
        .eq("id", listingId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    const newStatus = action === "approve" ? "active" : "rejected";
    const { error } = await supabase.from("listings").update({ status: newStatus }).eq("id", listingId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, status: newStatus });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
