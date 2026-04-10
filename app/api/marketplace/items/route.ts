import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// Public marketplace API — uses anon key (respects RLS: only approved items)
const getClient = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const country = searchParams.get("country");
    const sort = searchParams.get("sort") ?? "newest";

    const supabase = getClient();

    // Fetch approved items — no relationship join
    let query = supabase
      .from("marketplace_items")
      .select("*")
      .eq("status", "approved");

    if (category && category !== "all") {
      query = query.eq("category", category);
    }

    if (country && country !== "all") {
      const { data: listings } = await supabase
        .from("listings")
        .select("id")
        .eq("country", country);
      const ids = (listings ?? []).map((l: { id: string }) => l.id).filter(Boolean);
      if (ids.length === 0) {
        return NextResponse.json({ items: [] });
      }
      query = query.in("listing_id", ids);
    }

    // Sort
    switch (sort) {
      case "popular":    query = query.order("purchase_count", { ascending: false }); break;
      case "price_asc":  query = query.order("coin_price",     { ascending: true });  break;
      case "price_desc": query = query.order("coin_price",     { ascending: false }); break;
      default:           query = query.order("created_at",     { ascending: false }); break;
    }

    const { data: items, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!items || items.length === 0) {
      return NextResponse.json({ items: [] });
    }

    // Manual join — seller profiles (only public fields)
    const sellerIds = [...new Set(items.map((i: Record<string, unknown>) => i.seller_id as string))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", sellerIds);

    const profileMap = Object.fromEntries(
      (profiles ?? []).map((p: { id: string; full_name?: string; avatar_url?: string }) => [
        p.id,
        { full_name: p.full_name ?? null, avatar_url: p.avatar_url ?? null },
      ])
    );

    const enriched = items.map((item: Record<string, unknown>) => ({
      ...item,
      seller_name:   profileMap[item.seller_id as string]?.full_name  ?? null,
      seller_avatar: profileMap[item.seller_id as string]?.avatar_url ?? null,
    }));

    return NextResponse.json({ items: enriched });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
