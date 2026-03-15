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
    const search = searchParams.get("search") ?? "";

    const supabase = getClient();

    let query = supabase
      .from("marketplace_items")
      .select("*, profiles(full_name, avatar_url)")
      .order("created_at", { ascending: false });

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const items = (data ?? []).map((d: Record<string, unknown>) => ({
      ...d,
      seller_name: (d.profiles as Record<string, unknown> | null)?.full_name ?? null,
      seller_avatar: (d.profiles as Record<string, unknown> | null)?.avatar_url ?? null,
    }));

    // Client-side search filter
    const filtered = search
      ? items.filter((i: Record<string, unknown>) =>
          String(i.title ?? "").toLowerCase().includes(search.toLowerCase())
        )
      : items;

    return NextResponse.json({ items: filtered });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
