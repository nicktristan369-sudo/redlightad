import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail, profileApprovedEmail, profileRejectedEmail } from "@/lib/email";

// Map full country name → possible DB values (code variants + full name)
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
  return `country.eq.${name},country.eq.${name.toUpperCase().slice(0, 2)}`;
}

export const dynamic = "force-dynamic";

const getClient = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

// ── GET ────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id      = searchParams.get("id");     // single listing fetch
    const status  = searchParams.get("status");
    const country = searchParams.get("country");

    const supabase = getClient();

    // ── Single listing full fetch (for admin edit page) ──
    if (id) {
      const { data: listing, error } = await supabase
        .from("listings")
        .select("*")
        .eq("id", id)
        .single();
      if (error || !listing) return NextResponse.json({ error: "Ikke fundet" }, { status: 404 });
      return NextResponse.json({ listing: { ...listing, tier: listing.premium_tier } });
    }

    // ── List fetch (admin table) ──
    let query = supabase
      .from("listings")
      .select("id, title, category, gender, age, country, city, status, created_at, profile_image, user_id, premium_tier, in_carousel")
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
      in_carousel: (l.in_carousel as boolean | null) ?? false,
      user_name:   profileMap[l.user_id as string]?.full_name ?? null,
      user_email:  profileMap[l.user_id as string]?.email ?? null,
    }));

    return NextResponse.json({ listings: enriched });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// ── POST ───────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Record<string, unknown>;

    // Support both `id` (new admin edit page) and `listingId` (old admin table)
    const listingId = (body.id ?? body.listingId) as string;
    const action = body.action as string;

    if (!listingId || !action) {
      return NextResponse.json({ error: "id og action påkrævet" }, { status: 400 });
    }

    const supabase = getClient();

    // ── update_basics ──
    if (action === "update_basics") {
      const { error } = await supabase.from("listings").update({
        title:    body.title,
        category: body.category,
        gender:   body.gender,
        age:      body.age,
        country:  body.country,
        city:     body.city,
        location: body.location ?? body.city,
        status:   body.status,
      }).eq("id", listingId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    // ── update_details ──
    if (action === "update_details") {
      const { error } = await supabase.from("listings").update({
        about:          body.about,
        services:       body.services,
        languages:      body.languages,
        rate_1hour:     body.rate_1hour,
        rate_2hours:    body.rate_2hours,
        rate_overnight: body.rate_overnight,
        rate_weekend:   body.rate_weekend,
        currency:       body.currency,
      }).eq("id", listingId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    // ── update_contact ──
    if (action === "update_contact") {
      const { error } = await supabase.from("listings").update({
        phone:        body.phone,
        whatsapp:     body.whatsapp,
        telegram:     body.telegram,
        snapchat:     body.snapchat,
        email:        body.email,
        social_links: body.social_links,
      }).eq("id", listingId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    // ── delete_image ──
    if (action === "delete_image") {
      const imageUrl = body.image_url as string;
      if (!imageUrl) return NextResponse.json({ error: "image_url påkrævet" }, { status: 400 });
      // Remove from images array
      const { data: listing } = await supabase.from("listings").select("images").eq("id", listingId).single();
      if (!listing) return NextResponse.json({ error: "Ikke fundet" }, { status: 404 });
      const updated = ((listing.images as string[]) ?? []).filter((u: string) => u !== imageUrl);
      const { error } = await supabase.from("listings").update({ images: updated }).eq("id", listingId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    // ── delete ──
    if (action === "delete") {
      const { error } = await supabase.from("listings").delete().eq("id", listingId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    // ── reject ──
    if (action === "reject") {
      // Get listing info for email
      const { data: listing } = await supabase
        .from("listings")
        .select("user_id, title")
        .eq("id", listingId)
        .single();

      const { error } = await supabase.from("listings").update({ status: "rejected" }).eq("id", listingId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      // Send rejection email
      if (listing?.user_id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("email, full_name, email_notifications")
          .eq("id", listing.user_id)
          .single();

        if (profile?.email && profile.email_notifications !== false) {
          const reason = (body.reason as string) || undefined;
          const emailData = profileRejectedEmail({
            providerName: profile.full_name || "Provider",
            reason,
          });
          sendEmail({
            to: profile.email,
            subject: emailData.subject,
            html: emailData.html,
          }).catch(err => console.error("[Email] rejection notification error:", err));
        }
      }

      return NextResponse.json({ success: true });
    }

    // ── set_carousel ──
    if (action === "set_carousel") {
      const { error } = await supabase
        .from("listings")
        .update({ in_carousel: body.in_carousel ?? false })
        .eq("id", listingId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true });
    }

    // ── set_tier ──
    if (action === "set_tier") {
      const newTier = (body.tier ?? null) as string | null;
      const allowed = [null, "basic", "featured"];
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

    // ── approve (legacy) ──
    if (action === "approve") {
      // Get listing info for email
      const { data: listing } = await supabase
        .from("listings")
        .select("user_id, title")
        .eq("id", listingId)
        .single();

      const { error } = await supabase.from("listings").update({ status: "active" }).eq("id", listingId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      // Send approval email
      if (listing?.user_id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("email, full_name, email_notifications")
          .eq("id", listing.user_id)
          .single();

        if (profile?.email && profile.email_notifications !== false) {
          const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://redlightad.com";
          const emailData = profileApprovedEmail({
            providerName: profile.full_name || "Provider",
            profileUrl: `${siteUrl}/profile/${listingId}`,
          });
          sendEmail({
            to: profile.email,
            subject: emailData.subject,
            html: emailData.html,
          }).catch(err => console.error("[Email] approval notification error:", err));
        }
      }

      return NextResponse.json({ success: true, status: "active" });
    }

    return NextResponse.json({ error: "Ukendt action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
