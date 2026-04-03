import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import * as cheerio from 'cheerio'

export const maxDuration = 300

const getSupabase = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

const PHONE_REGEX_DK = /(?:\+45|0045)?[\s.\-]?\b(\d{2}[\s.\-]?\d{2}[\s.\-]?\d{2}[\s.\-]?\d{2})\b/g
const PHONE_REGEX_TEL = /href=["']tel:([\d\s\+\-]+)["']/g

function normalizePhone(phone: string): string {
  return phone.replace(/[\s\-\.]/g, '').trim()
}

function extractPhones(html: string): string[] {
  const results = new Set<string>()

  // Tel links — mest pålidelig
  for (const m of html.matchAll(/href=["']tel:([+\d\s\-().]+)["']/gi)) {
    const n = m[1].replace(/\D/g, '')
    if (n.length >= 8) results.add(n)
  }

  // Alle 8-cifrede tal (danske numre starter på 2-9)
  for (const m of html.matchAll(/\b([2-9]\d{7})\b/g)) {
    results.add(m[1])
  }

  // +45 numre
  for (const m of html.matchAll(/\+45[\s\-]?(\d{2}[\s\-]?\d{2}[\s\-]?\d{2}[\s\-]?\d{2})/g)) {
    results.add(m[1].replace(/\D/g, ''))
  }

  console.log('Phones found on page:', results.size)
  return [...results]
}

async function fetchPage(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml',
      'Accept-Language': 'da-DK,da;q=0.9',
    },
    signal: AbortSignal.timeout(10000),
  })
  return res.text()
}

function extractLinks(html: string, baseUrl: string): string[] {
  const $ = cheerio.load(html)
  const base = new URL(baseUrl)
  const links = new Set<string>()

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') || ''
    try {
      const url = new URL(href, baseUrl)
      if (
        url.hostname === base.hostname &&
        !url.pathname.match(/\.(jpg|jpeg|png|gif|webp|pdf|zip|css|js|svg|ico)$/i)
      ) {
        links.add(url.origin + url.pathname)
      }
    } catch {}
  })

  return [...links]
}

export async function GET(req: NextRequest) {
  const tag = req.nextUrl.searchParams.get('tag')
  let q = getSupabase()
    .from('scraped_phones')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500)
  if (tag && tag !== 'all') q = q.eq('tag', tag)
  const { data, error } = await q
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const { url, depth = 3, tag = 'untagged' } = await req.json()

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
        } catch {}
      }

      try {
        const supabase = getSupabase()
        const { data: existing } = await supabase
          .from('scraped_phones')
          .select('phone')

        const existingPhones = new Set(
          ((existing || []) as any[]).map((r: any) => normalizePhone(r.phone))
        )

        const visited = new Set<string>()
        const queue: Array<{ url: string; depth: number }> = [{ url, depth: 0 }]
        const found = new Map<string, string>()

        let pageCount = 0
        let errorCount = 0
        let newCount = 0
        let dupCount = 0

        send({ type: 'start', message: 'Starter scrape...' })

        while (queue.length > 0) {
          const current = queue.shift()!

          if (visited.has(current.url)) continue
          if (current.depth > depth) continue
          visited.add(current.url)
          pageCount++

          send({
            type: 'progress',
            message: `Scanner side ${pageCount} (${queue.length} i ko)...`,
            url: current.url,
            pageCount,
            queueSize: queue.length,
            phonesFound: found.size,
          })

          try {
            const html = await fetchPage(current.url)

            const phones = extractPhones(html)
            phones.forEach(phone => {
              if (!found.has(phone)) {
                found.set(phone, current.url)
              }
            })

            // Gem til DB løbende — ikke vent til sidst
            if (phones.length > 0) {
              const toInsert = phones
                .filter(phone => !existingPhones.has(phone))
                .map(phone => ({
                  phone,
                  source_url: current.url,
                  source_domain: (() => { try { return new URL(current.url).hostname } catch { return '' } })(),
                  tag,
                  status: 'new',
                  sms_status: 'pending',
                  is_duplicate: false,
                  first_seen: new Date().toISOString(),
                }))

              if (toInsert.length > 0) {
                await supabase.from('scraped_phones').insert(toInsert)
                // Tilføj til existingPhones så næste side ikke genduplikerer
                toInsert.forEach(r => existingPhones.add(r.phone))
                newCount += toInsert.length
              }
            }

            if (current.depth < depth) {
              const links = extractLinks(html, current.url)
              links.forEach(link => {
                if (!visited.has(link)) {
                  queue.push({ url: link, depth: current.depth + 1 })
                }
              })
            }
          } catch (err: any) {
            errorCount++
            send({ type: 'warning', message: `Sprang over: ${current.url}` })
          }

          await new Promise(r => setTimeout(r, 150))
        }

        dupCount = found.size - newCount

        send({
          type: 'done',
          message: `Faerdig! ${found.size} numre fundet \u00b7 ${newCount} nye \u00b7 ${dupCount} allerede i phonebook`,
          total: found.size,
          newCount,
          dupCount,
          pagesScanned: pageCount,
          errors: errorCount,
        })
      } catch (err: any) {
        send({ type: 'error', message: err.message })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}

export async function DELETE(req: NextRequest) {
  let body: { id?: string } = {}
  try {
    body = await req.json()
  } catch {
    // No body = delete all
  }

  if (body.id) {
    const { error } = await getSupabase().from('scraped_phones').delete().eq('id', body.id)
    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ success: true })
  }

  const { error, count } = await getSupabase()
    .from('scraped_phones')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000')

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ success: true, deleted: count })
}
