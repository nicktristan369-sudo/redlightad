export const dynamic = "force-dynamic";
export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const getClient = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

// ── Phone matching ─────────────────────────────────────────────────────────
//
// Strategy: multiple specific patterns instead of one broad regex.
// Dots and hyphens are NEVER allowed as digit separators (they indicate
// times, dates, prices, etc.). Only spaces are permitted between groups.

const PHONE_PATTERNS: RegExp[] = [
  // International +XX… — e.g. +45 12 34 56 78, +4512345678, +1 800 555 0100
  /\+\d{1,3}(?:\s\d{2,5}){1,4}/g,
  // International +XX without spaces — e.g. +4512345678
  /\+\d{9,15}/g,
  // 00-prefix international — e.g. 004512345678
  /\b00\d{10,14}\b/g,
  // Local 8 digits with exactly 2-digit space groups: XX XX XX XX
  /\b\d{2} \d{2} \d{2} \d{2}\b/g,
  // Local 4+4: XXXX XXXX
  /\b\d{4} \d{4}\b/g,
  // Local plain 8 consecutive digits (word-bounded)
  /\b\d{8}\b/g,
  // 10-12 consecutive (some EU/US formats)
  /\b\d{10,12}\b/g,
];

function looksLikePhone(raw: string): boolean {
  // Dots → time (11.00), decimal, IP address → reject
  if (raw.includes(".")) return false;
  // Hyphens → time range, date, article number → reject
  if (raw.includes("-")) return false;

  const digits = raw.replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 15) return false;
  // Pure year
  if (/^(19|20)\d{2}$/.test(digits)) return false;
  // All same digit (00000000, 11111111, etc.)
  if (/^(\d)\1{7,}$/.test(digits)) return false;
  // Too many repeated patterns (prices like 500500500)
  if (/^(\d{3,4})\1{2,}$/.test(digits)) return false;

  return true;
}

function normalise(raw: string): string {
  return raw.replace(/\s+/g, " ").trim();
}

function extractPhones(html: string): string[] {
  // Strip code that doesn't contain real phone numbers
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ");

  const found = new Set<string>();
  for (const pattern of PHONE_PATTERNS) {
    pattern.lastIndex = 0; // reset stateful regex
    for (const m of text.matchAll(new RegExp(pattern))) {
      const candidate = m[0].trim();
      if (looksLikePhone(candidate)) {
        found.add(normalise(candidate));
      }
    }
  }
  return [...found];
}

// ── Link extraction ────────────────────────────────────────────────────────

const SKIP_EXT =
  /\.(jpg|jpeg|png|gif|svg|webp|ico|css|js|json|xml|pdf|zip|mp4|mp3|woff2?|ttf|eot)(\?|$)/i;

function extractInternalLinks(html: string, baseUrl: string): string[] {
  const base = new URL(baseUrl);
  const links: string[] = [];

  // More permissive: match <a href="..."> or <a href='...'>
  const re = /<a(?:\s+[^>]*)?\s+href=["']([^"']+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const href = m[1].trim();
    if (!href) continue;
    if (href.startsWith("#")) continue;
    if (href.startsWith("javascript:")) continue;
    if (href.startsWith("mailto:")) continue;
    if (href.startsWith("tel:")) continue;
    try {
      const u = new URL(href, baseUrl);
      if (u.hostname !== base.hostname) continue;
      if (SKIP_EXT.test(u.pathname)) continue;
      u.hash = "";
      u.search = ""; // normalise for dedup
      const normalised = u.toString();
      // Skip if it's exactly the base URL (homepage links)
      if (normalised === baseUrl || normalised === baseUrl.replace(/\/$/, "")) continue;
      links.push(normalised);
    } catch { /* skip */ }
  }
  return [...new Set(links)];
}

async function fetchPage(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,*/*;q=0.8",
        "Accept-Language": "da,en;q=0.9",
      },
      signal: controller.signal,
      redirect: "follow",
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") ?? "";
    if (!ct.includes("text/html") && !ct.includes("text/plain")) return null;
    return await res.text();
  } catch {
    return null;
  }
}

// ── GET ─────────────────────────────────────────────────────────────────────
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
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// ── POST — crawl + stream progress ─────────────────────────────────────────
export async function POST(req: NextRequest) {
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

  const MAX_PAGES = 50;
  const MAX_DEPTH = 2;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        try {
          controller.enqueue(encoder.encode(JSON.stringify(data) + "\n"));
        } catch { /* stream closed */ }
      };

      try {
        const rootUrl = new URL(url.trim());
        rootUrl.hash = "";
        rootUrl.search = "";
        const rootUrlStr = rootUrl.toString();

        const visited = new Set<string>();
        // toSave: per-page, NOT globally deduplicated
        // → each (phone, source_url) pair is unique; same phone on different pages = multiple rows
        const toSave: { phone: string; source_url: string; tag: string }[] = [];

        // BFS: [url, depth]
        const queue: [string, number][] = [[rootUrlStr, 0]];
        // Use a Set for O(1) queue membership check
        const inQueue = new Set<string>([rootUrlStr]);
        let pageCount = 0;
        let totalPhonesFound = 0;

        while (queue.length > 0 && pageCount < MAX_PAGES) {
          const [currentUrl, depth] = queue.shift()!;
          inQueue.delete(currentUrl);

          if (visited.has(currentUrl)) continue;
          visited.add(currentUrl);
          pageCount++;

          const estimatedTotal = Math.min(pageCount + queue.length, MAX_PAGES);
          send({
            type: "progress",
            current: pageCount,
            total: estimatedTotal,
            url: currentUrl,
            phones_found: totalPhonesFound,
          });

          const html = await fetchPage(currentUrl);
          if (!html) {
            send({ type: "skip", url: currentUrl });
            continue;
          }

          // Extract phones — save each with this page's URL (no global dedup)
          const phones = extractPhones(html);
          if (phones.length > 0) {
            totalPhonesFound += phones.length;
            for (const phone of phones) {
              toSave.push({ phone, source_url: currentUrl, tag });
            }
            send({ type: "found", url: currentUrl, count: phones.length, phones_total: totalPhonesFound });
          }

          // Queue internal links if we haven't reached max depth
          if (depth < MAX_DEPTH) {
            const links = extractInternalLinks(html, currentUrl);
            for (const link of links) {
              if (!visited.has(link) && !inQueue.has(link) && pageCount + queue.length < MAX_PAGES) {
                queue.push([link, depth + 1]);
                inQueue.add(link);
              }
            }
          }
        }

        // Batch save — upsert deduplicates per (phone, source_url)
        let savedCount = 0;
        if (toSave.length > 0) {
          send({ type: "saving", count: toSave.length });
          const BATCH = 50;
          for (let i = 0; i < toSave.length; i += BATCH) {
            const { data } = await getClient()
              .from("scraped_phones")
              .upsert(toSave.slice(i, i + BATCH), {
                onConflict: "phone,source_url",
                ignoreDuplicates: true,
              })
              .select("id");
            savedCount += data?.length ?? 0;
          }
        }

        send({
          type: "done",
          saved: savedCount,
          total_found: totalPhonesFound,
          pages_scanned: pageCount,
          phones: [...new Set(toSave.map(r => r.phone))].slice(0, 20),
          message: `Scanned ${pageCount} page${pageCount !== 1 ? "s" : ""} — found ${totalPhonesFound} number${totalPhonesFound !== 1 ? "s" : ""} — saved ${savedCount} new`,
        });
      } catch (e) {
        send({ type: "error", error: String(e) });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    },
  });
}

// ── DELETE ──────────────────────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    let body: { id?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const { error } = await getClient().from("scraped_phones").delete().eq("id", body.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
