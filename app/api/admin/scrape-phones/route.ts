export const dynamic = "force-dynamic";
export const maxDuration = 120;

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { spawn } from "child_process";
import path from "path";

const getClient = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

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

// ── POST — spawn Python scraper, stream progress, then classify & insert ──
export async function POST(req: NextRequest) {
  let body: { url?: string; tag?: string; maxDepth?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { url, tag = "untagged", maxDepth = 2 } = body;
  if (!url?.trim()) {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }

  const encoder = new TextEncoder();
  const scraperPath = path.join(process.cwd(), "scripts", "scraper.py");

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        try {
          controller.enqueue(encoder.encode(JSON.stringify(data) + "\n"));
        } catch { /* stream closed */ }
      };

      try {
        // Spawn Python scraper
        const scrapedPhones = await new Promise<string[]>((resolve, reject) => {
          const proc = spawn("python3", [scraperPath, url!.trim(), String(maxDepth)], {
            stdio: ["ignore", "pipe", "pipe"],
          });

          let allPhones: string[] = [];
          let buffer = "";

          proc.stdout.on("data", (chunk: Buffer) => {
            buffer += chunk.toString();
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              if (!line.trim()) continue;
              try {
                const parsed = JSON.parse(line);
                if (parsed.done) {
                  allPhones = parsed.phones || [];
                } else if (parsed.progress !== undefined) {
                  send({ type: "progress", current: parsed.progress, phones_found: parsed.phones, url: parsed.url });
                }
              } catch { /* skip malformed lines */ }
            }
          });

          let stderr = "";
          proc.stderr.on("data", (chunk: Buffer) => {
            stderr += chunk.toString();
          });

          proc.on("close", (code) => {
            // Process remaining buffer
            if (buffer.trim()) {
              try {
                const parsed = JSON.parse(buffer);
                if (parsed.done) allPhones = parsed.phones || [];
              } catch { /* skip */ }
            }

            if (code !== 0 && allPhones.length === 0) {
              reject(new Error(`Scraper exited with code ${code}: ${stderr.slice(0, 200)}`));
            } else {
              resolve(allPhones);
            }
          });

          proc.on("error", (err) => reject(err));
        });

        // ── Duplicate detection ──────────────────────────────────────────
        send({ type: "classifying", total: scrapedPhones.length });

        // Get existing phone numbers from DB
        const { data: existingRows } = await getClient()
          .from("scraped_phones")
          .select("phone");
        const existingSet = new Set((existingRows ?? []).map((r: { phone: string }) => r.phone));

        const newNumbers: string[] = [];
        const duplicates: string[] = [];

        for (const phone of scrapedPhones) {
          if (existingSet.has(phone)) {
            duplicates.push(phone);
          } else {
            newNumbers.push(phone);
          }
        }

        // Insert only new numbers
        let savedCount = 0;
        if (newNumbers.length > 0) {
          send({ type: "saving", count: newNumbers.length });
          const rows = newNumbers.map(phone => ({
            phone,
            source_url: url!.trim(),
            tag,
            is_duplicate: false,
            first_seen: new Date().toISOString(),
          }));
          const BATCH = 50;
          for (let i = 0; i < rows.length; i += BATCH) {
            const { data } = await getClient()
              .from("scraped_phones")
              .insert(rows.slice(i, i + BATCH))
              .select("id");
            savedCount += data?.length ?? 0;
          }
        }

        send({
          type: "done",
          total: scrapedPhones.length,
          new_numbers: newNumbers.length,
          duplicates: duplicates.length,
          saved: savedCount,
          phones: scrapedPhones.slice(0, 20),
          message: `Fandt ${scrapedPhones.length} numre \u00b7 ${newNumbers.length} nye \u00b7 ${duplicates.length} allerede i phonebook`,
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
    let body: { id?: string; all?: boolean };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    // Delete all scraped phones
    if (body.all) {
      const { error } = await getClient().from("scraped_phones").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true });
    }

    if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const { error } = await getClient().from("scraped_phones").delete().eq("id", body.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
