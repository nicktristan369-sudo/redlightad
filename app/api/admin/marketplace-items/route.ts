import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const getClient = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // bypasses RLS
  );

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status"); // pending | approved | rejected | all

    const supabase = getClient();

    // Fetch items without relationship join (avoids schema cache issues)
    let query = supabase
      .from("marketplace_items")
      .select("*")
      .order("created_at", { ascending: false });

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    const { data: items, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!items || items.length === 0) {
      return NextResponse.json({ items: [] });
    }

    // Manual join: fetch seller profiles
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
      seller_name: profileMap[item.seller_id as string]?.full_name ?? null,
      seller_avatar: profileMap[item.seller_id as string]?.avatar_url ?? null,
    }));

    return NextResponse.json({ items: enriched });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
