export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const getClient = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

// Broad international phone regex — matches most common formats
// e.g. +45 12 34 56 78, (123) 456-7890, +1-800-555-0100, 004512345678
const PHONE_REGEX =
  /(?:\+|00)?(?:\d[\s\-\.]?){7,15}\d/g;

// Filter out obvious non-phones (pure dates, zip codes, etc.)
function looksLikePhone(raw: string): boolean {
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) return false;
  // Exclude things that look like years only
  if (/^(19|20)\d{2}$/.test(digits)) return false;
  return true;
}

function normalise(raw: string): string {
  // Collapse whitespace and dashes to keep readable form
  return raw.replace(/\s+/g, " ").trim();
}

// GET — list scraped phones (optionally filter by tag or source)
export async function GET(req: NextRequest) {
  const tag = req.nextUrl.searchParams.get("tag");
  const supabase = getClient();
  let q = supabase
    .from("scraped_phones")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);
  if (tag && tag !== "all") q = q.eq("tag", tag);
  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

// POST — scrape a URL and save found numbers
export async function POST(req: NextRequest) {
  const { url, tag = "untagged" } = await req.json();
  if (!url) return NextResponse.json({ error: "url required" }, { status: 400 });

  // Fetch the page server-side
  let html: string;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; RedLightAD-Scraper/1.0)" },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return NextResponse.json({ error: `HTTP ${res.status} from target URL` }, { status: 400 });
    html = await res.text();
  } catch (e) {
    return NextResponse.json({ error: `Failed to fetch URL: ${String(e)}` }, { status: 400 });
  }

  // Strip HTML tags for cleaner matching
  const text = html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ");

  // Extract phone numbers
  const raw = text.match(PHONE_REGEX) ?? [];
  const phones = [...new Set(raw.filter(looksLikePhone).map(normalise))];

  if (phones.length === 0) {
    return NextResponse.json({ saved: 0, phones: [], message: "No phone numbers found on this page" });
  }

  // Upsert into scraped_phones (skip exact duplicates for same source_url)
  const rows = phones.map(phone => ({ phone, source_url: url, tag }));
  const { data: inserted, error: dbErr } = await getClient()
    .from("scraped_phones")
    .upsert(rows, { onConflict: "phone,source_url", ignoreDuplicates: true })
    .select("id, phone");

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });

  return NextResponse.json({
    saved: inserted?.length ?? phones.length,
    phones,
    message: `Found ${phones.length} number(s) — saved ${inserted?.length ?? phones.length} new`,
  });
}

// DELETE — delete a single scraped phone by id
export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await getClient().from("scraped_phones").delete().eq("id", id);
  return NextResponse.json({ ok: true });
}
