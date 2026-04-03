import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import axios from 'axios'
import * as cheerio from 'cheerio'

const getSupabase = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

const PHONE_REGEX = /(?:\+?45[\s\-.]?)?(?:\d[\s\-.]?){7}\d/g

function normalizePhone(phone: string): string {
  return phone.replace(/[\s\-\.]/g, '').trim()
}

function extractPhones(html: string): string[] {
  const $ = cheerio.load(html)
  const results = new Set<string>()

  const text = $('body').text()
  const matches = text.match(PHONE_REGEX) || []
  matches.forEach(m => {
    const n = normalizePhone(m)
    if (n.length >= 8) results.add(n)
  })

  $('a[href^="tel:"]').each((_, el) => {
    const href = $(el).attr('href') || ''
    const n = normalizePhone(href.replace('tel:', ''))
    if (n.length >= 8) results.add(n)
  })

  return [...results]
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
    .from('phonebook')
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
        const { data: existing } = await getSupabase()
          .from('phonebook')
          .select('phone')

        const existingPhones = new Set(
          ((existing || []) as any[]).map((r: any) => normalizePhone(r.phone))
        )

        const visited = new Set<string>()
        const queue: Array<{ url: string; depth: number }> = [{ url, depth: 0 }]
        const found = new Map<string, string>()

        let pageCount = 0
        let errorCount = 0

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
            const response = await axios.get(current.url, {
              timeout: 12000,
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'da-DK,da;q=0.9,en;q=0.8',
                'Accept-Encoding': 'gzip, deflate, br',
                'Cache-Control': 'no-cache',
              },
              maxRedirects: 5,
            })

            const html = response.data as string

            const phones = extractPhones(html)
            phones.forEach(phone => {
              if (!found.has(phone)) {
                found.set(phone, current.url)
              }
            })

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

        const toInsert: any[] = []
        let newCount = 0
        let dupCount = 0

        for (const [phone, sourceUrl] of found) {
          if (existingPhones.has(phone)) {
            dupCount++
          } else {
            newCount++
            toInsert.push({
              phone,
              source_url: sourceUrl,
              tag,
              status: 'new',
              is_duplicate: false,
              first_seen: new Date().toISOString(),
            })
          }
        }

        if (toInsert.length > 0) {
          const { error } = await getSupabase().from('phonebook').insert(toInsert)
          if (error) throw new Error(`DB fejl: ${error.message}`)
        }

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
    const { error } = await getSupabase().from('phonebook').delete().eq('id', body.id)
    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ success: true })
  }

  const { error, count } = await getSupabase()
    .from('phonebook')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000')

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ success: true, deleted: count })
}
