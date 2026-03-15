export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const getClient = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

// International phone regex — matches +45 12 34 56 78, 004512345678, (123) 456-7890, etc.
const PHONE_REGEX = /(?:\+|00)?(?:\d[\s\-\.]?){7,15}\d/g;

function looksLikePhone(raw: string): boolean {
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) return false;
  if (/^(19|20)\d{2}$/.test(digits)) return false; // skip years
  if (/^\d{4,5}$/.test(digits)) return false;       // skip short zip-like
  return true;
}

function normalise(raw: string): string {
  return raw.replace(/\s+/g, " ").trim();
}

// ── GET — list scraped phones ──────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const tag = req.nextUrl.searchParams.get("tag");
    let q = getClient()
      .from("scraped_phones")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (tag && tag !== "all") q = q.eq("tag", tag);
    const { data, error } = await q;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data ?? []);
  } catch (e) {
    return NextResponse.json({ error: `Unexpected error: ${String(e)}` }, { status: 500 });
  }
}

// ── POST — scrape URL ──────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    let body: { url?: string; tag?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { url, tag = "untagged" } = body;
    if (!url?.trim()) {
      return NextResponse.json({ error: "url is required" }, { status: 400 });
    }

    // Fetch page server-side with 12s timeout
    let html: string;
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 12000);
      const res = await fetch(url.trim(), {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,*/*",
          "Accept-Language": "da,en;q=0.9",
        },
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!res.ok) {
        return NextResponse.json(
          { error: `Target returned HTTP ${res.status}` },
          { status: 400 }
        );
      }
      html = await res.text();
    } catch (e) {
      const msg = String(e);
      if (msg.includes("abort") || msg.includes("timeout")) {
        return NextResponse.json({ error: "Request timed out (>12s)" }, { status: 408 });
      }
      return NextResponse.json({ error: `Could not fetch URL: ${msg}` }, { status: 400 });
    }

    // Strip HTML → plain text for cleaner matching
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/\s+/g, " ");

    const rawMatches = text.match(PHONE_REGEX) ?? [];
    const phones = [...new Set(rawMatches.filter(looksLikePhone).map(normalise))];

    if (phones.length === 0) {
      return NextResponse.json({
        saved: 0,
        phones: [],
        message: "No phone numbers found on this page",
      });
    }

    // Insert rows — skip duplicates via unique constraint (phone, source_url)
    const rows = phones.map((phone) => ({ phone, source_url: url.trim(), tag }));

    const { data: inserted, error: dbErr } = await getClient()
      .from("scraped_phones")
      .upsert(rows, { onConflict: "phone,source_url", ignoreDuplicates: true })
      .select("id, phone");

    if (dbErr) {
      // Fallback: plain insert, ignore individual conflicts
      let newCount = 0;
      for (const row of rows) {
        const { error: iErr } = await getClient()
          .from("scraped_phones")
          .insert(row);
        if (!iErr) newCount++;
      }
      return NextResponse.json({
        saved: newCount,
        phones,
        message: `Found ${phones.length} number(s) — saved ${newCount} new`,
      });
    }

    return NextResponse.json({
      saved: inserted?.length ?? phones.length,
      phones,
      message: `Found ${phones.length} number(s) — saved ${inserted?.length ?? phones.length} new`,
    });
  } catch (e) {
    return NextResponse.json(
      { error: `Unexpected server error: ${String(e)}` },
      { status: 500 }
    );
  }
}

// ── DELETE — remove single entry ───────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    let body: { id?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const { error } = await getClient()
      .from("scraped_phones")
      .delete()
      .eq("id", body.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
