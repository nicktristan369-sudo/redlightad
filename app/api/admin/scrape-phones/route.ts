export const dynamic = "force-dynamic";
export const maxDuration = 60; // Vercel Pro — 60s max

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const getClient = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

// ── Helpers ────────────────────────────────────────────────────────────────

const PHONE_REGEX = /(?:\+|00)?(?:\d[\s\-\.]?){7,15}\d/g;

function looksLikePhone(raw: string): boolean {
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) return false;
  if (/^(19|20)\d{2}$/.test(digits)) return false;
  if (/^\d{1,6}$/.test(digits)) return false;
  return true;
}

function normalise(raw: string): string {
  return raw.replace(/\s+/g, " ").trim();
}

function extractPhones(html: string): string[] {
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ");
  const raw = text.match(PHONE_REGEX) ?? [];
  return [...new Set(raw.filter(looksLikePhone).map(normalise))];
}

const SKIP_EXT = /\.(jpg|jpeg|png|gif|svg|webp|css|js|json|xml|pdf|zip|mp4|mp3|woff2?|ttf)(\?|$)/i;

function extractInternalLinks(html: string, baseUrl: string): string[] {
  const base = new URL(baseUrl);
  const hrefs = [...html.matchAll(/href=["']([^"'#?][^"']*?)["']/gi)].map(m => m[1]);
  const links: string[] = [];
  for (const href of hrefs) {
    try {
      const u = new URL(href, baseUrl);
      if (u.hostname !== base.hostname) continue;
      if (SKIP_EXT.test(u.pathname)) continue;
      u.hash = "";
      u.search = ""; // ignore query params for dedup
      links.push(u.toString());
    } catch { /* skip invalid */ }
  }
  return [...new Set(links)];
}

async function fetchPage(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,*/*;q=0.8",
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
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

// ── POST — crawl site + stream progress ───────────────────────────────────
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
        } catch { /* stream might be closed */ }
      };

      try {
        const rootUrl = url.trim();
        const visited = new Set<string>();
        const allPhones = new Set<string>();
        const toSave: { phone: string; source_url: string; tag: string }[] = [];

        // BFS queue: [url, depth]
        const queue: [string, number][] = [[rootUrl, 0]];
        let pageCount = 0;

        while (queue.length > 0 && pageCount < MAX_PAGES) {
          const [currentUrl, depth] = queue.shift()!;
          if (visited.has(currentUrl)) continue;
          visited.add(currentUrl);
          pageCount++;

          // Estimate total based on queue size (capped at MAX_PAGES)
          const estimatedTotal = Math.min(pageCount + queue.length, MAX_PAGES);

          send({
            type: "progress",
            current: pageCount,
            total: estimatedTotal,
            url: currentUrl,
            phones_found: allPhones.size,
          });

          const html = await fetchPage(currentUrl);
          if (!html) {
            send({ type: "skip", url: currentUrl, reason: "fetch failed" });
            continue;
          }

          // Extract phones from this page
          const phones = extractPhones(html);
          let newOnPage = 0;
          for (const phone of phones) {
            if (!allPhones.has(phone)) {
              allPhones.add(phone);
              toSave.push({ phone, source_url: currentUrl, tag });
              newOnPage++;
            }
          }

          if (newOnPage > 0) {
            send({ type: "found", url: currentUrl, count: newOnPage, phones_total: allPhones.size });
          }

          // Queue internal links (only depth < MAX_DEPTH)
          if (depth < MAX_DEPTH) {
            const links = extractInternalLinks(html, currentUrl);
            for (const link of links) {
              if (!visited.has(link) && queue.every(([u]) => u !== link) && pageCount + queue.length < MAX_PAGES) {
                queue.push([link, depth + 1]);
              }
            }
          }
        }

        // Batch save to DB
        let savedCount = 0;
        if (toSave.length > 0) {
          send({ type: "saving", count: toSave.length });
          const BATCH = 50;
          for (let i = 0; i < toSave.length; i += BATCH) {
            const batch = toSave.slice(i, i + BATCH);
            const { data } = await getClient()
              .from("scraped_phones")
              .upsert(batch, { onConflict: "phone,source_url", ignoreDuplicates: true })
              .select("id");
            savedCount += data?.length ?? 0;
          }
        }

        send({
          type: "done",
          saved: savedCount,
          total_found: allPhones.size,
          pages_scanned: pageCount,
          phones: [...allPhones].slice(0, 20),
          message: `Scanned ${pageCount} page${pageCount !== 1 ? "s" : ""} — found ${allPhones.size} number${allPhones.size !== 1 ? "s" : ""} — saved ${savedCount} new`,
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

// ── DELETE — remove single entry ───────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    let body: { id?: string };
    try { body = await req.json(); }
    catch { return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }); }
    if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const { error } = await getClient().from("scraped_phones").delete().eq("id", body.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
