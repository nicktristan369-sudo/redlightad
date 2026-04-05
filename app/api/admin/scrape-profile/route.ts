import { NextRequest, NextResponse } from "next/server"
import { load } from "cheerio"
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CheerioDoc = ReturnType<typeof load>

export async function POST(req: NextRequest) {
  const { url } = await req.json()
  if (!url) return NextResponse.json({ error: "No URL" }, { status: 400 })

  let html = ""

  // 1. FlareSolverr (self-hosted, free, Cloudflare bypass)
  const flareSolverrUrl = process.env.FLARESOLVERR_URL // e.g. http://76.13.154.9:8191
  if (flareSolverrUrl) {
    try {
      const res = await fetch(`${flareSolverrUrl}/v1`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cmd: "request.get", url, maxTimeout: 60000 }),
      })
      if (res.ok) {
        const data = await res.json()
        html = data?.solution?.response ?? ""
      }
    } catch {}
  }

  // 2. ScrapingBee fallback (paid, if SCRAPINGBEE_API_KEY set)
  if (!html) {
    const sbKey = process.env.SCRAPINGBEE_API_KEY
    if (sbKey) {
      try {
        const sbUrl = `https://app.scrapingbee.com/api/v1/?api_key=${sbKey}&url=${encodeURIComponent(url)}&render_js=true&premium_proxy=true`
        const res = await fetch(sbUrl)
        if (res.ok) html = await res.text()
      } catch {}
    }
  }

  // 3. Direct fetch (no Cloudflare bypass)
  if (!html) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
        }
      })
      if (res.ok) html = await res.text()
    } catch {}
  }

  if (!html) {
    return NextResponse.json(
      { error: "Could not fetch page. Set FLARESOLVERR_URL=http://76.13.154.9:8191 in Vercel env vars." },
      { status: 422 }
    )
  }

  const $ = load(html)
  const domain = new URL(url).hostname

  let result: Record<string, unknown> = {}
  if (domain.includes("eurogirlsescort")) {
    result = parseEuroGirlsEscort($, url)
  } else {
    result = parseGeneric($, url)
  }

  return NextResponse.json(result)
}

function parseEuroGirlsEscort($: CheerioDoc, url: string) {
  const name = $("h1").first().text().trim() ||
    $("[class*=name]").first().text().trim()

  const age = $("[class*=age]").first().text().replace(/\D/g, "").trim()

  const city = $("[class*=city]").first().text().trim() ||
    $("[class*=location]").first().text().trim()

  const phone = $("a[href^='tel:']").first().attr("href")?.replace("tel:", "") ||
    $("[class*=phone]").first().text().trim()

  const description = $("[class*=description]").first().text().trim().slice(0, 2000) ||
    $("[class*=about]").first().text().trim().slice(0, 2000) ||
    $("[class*=bio]").first().text().trim().slice(0, 2000)

  const height = $("[class*=height]").first().text().replace(/\D/g, "").trim()
  const weight = $("[class*=weight]").first().text().replace(/\D/g, "").trim()
  const nationality = $("[class*=nation]").first().text().trim() ||
    $("[class*=country]").first().text().trim()

  const images: string[] = []
  $("img[src*='escorts'], img[src*='profile'], img[src*='photo'], img[data-src]").each((_i, el) => {
    const src = $(el).attr("data-src") || $(el).attr("src") || ""
    if (src.startsWith("http") && !images.includes(src)) images.push(src)
  })

  return { name, age, city, phone, description, images: images.slice(0, 10), height, weight, nationality, source_url: url }
}

function parseGeneric($: CheerioDoc, url: string) {
  const name = $("h1").first().text().trim()
  const description =
    $("meta[name='description']").attr("content") ||
    $("[class*=description], [class*=about], [class*=bio]").first().text().trim().slice(0, 2000)

  const images: string[] = []
  $("img").each((_i, el) => {
    const src = $(el).attr("src") || ""
    if (src.startsWith("http") && !images.includes(src)) images.push(src)
  })

  return { name, description, images: images.slice(0, 10), source_url: url }
}
