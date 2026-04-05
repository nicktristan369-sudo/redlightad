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

  // Return both flat format (Step 2 import) and nested profile format (Step 1 handleScrape)
  return NextResponse.json({
    ...result,
    profile: {
      title: result.name,
      display_name: result.name,
      age: result.age ? parseInt(result.age as string) || null : null,
      location: result.city,
      city: result.city,
      country: (result.nationality as string) || "",
      nationality: result.nationality,
      phone: result.phone,
      telegram: result.telegram,
      description: result.description,
      height: result.height,
      weight: result.weight,
      languages: result.languages,
      services: result.services,
      ethnicity: result.ethnicity,
      video_url: result.video,
      images: result.images,
    }
  })
}

function parseEuroGirlsEscort($: CheerioDoc, url: string) {
  const name = $("h1").first().text().trim() ||
    $("[class*=name]").first().text().trim()

  // Description/bio — find "Hello!" text block
  let description = ""
  $("p span, p").each((_i, el) => {
    const txt = $(el).text().trim()
    if (txt.length > 80 && !description) description = txt
  })
  description = description.slice(0, 2000)

  // Profile attributes from rows: <span>Label:</span><strong>Value</strong>
  const attrs: Record<string, string> = {}
  $("div.row, tr").each((_i, el) => {
    const label = $(el).find("span").first().text().replace(":", "").trim().toLowerCase()
    const value = $(el).find("strong").first().text().trim()
    if (label && value) attrs[label] = value
  })

  // Also parse <span>Label:</span><strong>Value</strong> pattern directly
  $("span").each((_i, el) => {
    const txt = $(el).text().trim()
    if (txt.endsWith(":")) {
      const label = txt.slice(0, -1).toLowerCase()
      const value = $(el).next("strong").text().trim() || $(el).parent().find("strong").first().text().trim()
      if (value && !attrs[label]) attrs[label] = value
    }
  })

  const age = attrs["age"] || $("[class*=age]").first().text().replace(/\D/g, "").trim()
  const city = attrs["city"] || attrs["location"]?.split("/")[0]?.trim() || ""
  const nationality = attrs["nationality"] || ""
  const height = attrs["height"]?.match(/\d+/)?.[0] || ""
  const weight = attrs["weight"]?.match(/\d+/)?.[0] || ""
  const languages = attrs["languages"] || ""
  const services = attrs["services"] || ""
  const ethnicity = attrs["ethnicity"] || ""
  const available = attrs["available for"] || ""

  // Phone — partially visible in span.opacity-horizontal, encrypted in data-phone
  const phonePartial = $(".opacity-horizontal").first().text().replace(/\u00a0/g, "").trim()
  const phone = phonePartial || ""

  // Telegram — data-telegram attribute
  const telegram = $("[data-telegram]").first().attr("data-telegram") || ""

  // WhatsApp — check if WhatsApp icon exists
  const hasWhatsapp = $(".icon-whatsapp, [class*=whatsapp]").length > 0

  // Video URL — data-video attribute
  const video = $("[data-video]").first().attr("data-video") || ""

  const images: string[] = []
  const adDomains = ["escortmodels", "escortmod", "banner", "advert", "sponsor", "affiliate", "promo"]

  // First: gallery/slider containers only
  $("[class*=gallery] img, [class*=slider] img, [class*=photo] img, [class*=album] img, .swiper-slide img, .owl-item img, [class*=carousel] img").each((_i, el) => {
    const src = $(el).attr("data-src") || $(el).attr("data-lazy") || $(el).attr("src") || ""
    if (!src.startsWith("http")) return
    if (adDomains.some(d => src.toLowerCase().includes(d))) return
    if (!images.includes(src)) images.push(src)
  })

  // Fallback: broad scan but exclude ad networks
  if (images.length === 0) {
    $("img[src*='escorts'], img[src*='profile'], img[src*='photo'], img[data-src]").each((_i, el) => {
      const src = $(el).attr("data-src") || $(el).attr("src") || ""
      if (!src.startsWith("http")) return
      if (adDomains.some(d => src.toLowerCase().includes(d))) return
      if (!images.includes(src)) images.push(src)
    })
  }

  return { name, age, city, phone, telegram, hasWhatsapp, description, images: images.slice(0, 10), video, height, weight, nationality, languages, services, ethnicity, available, source_url: url }
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
