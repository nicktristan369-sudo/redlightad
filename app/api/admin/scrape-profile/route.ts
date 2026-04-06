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
      country: result.country || "",
      nationality: result.nationality,
      phone: result.phone,
      telegram: result.telegram,
      description: result.description,
      height: result.height,
      weight: result.weight,
      languages: typeof result.languages === "string"
        ? (result.languages as string).split(",").map((l: string) => l.trim()).filter(Boolean)
        : result.languages || [],
      services: typeof result.services === "string"
        ? (result.services as string).split(",").map((s: string) => s.trim()).filter(Boolean)
        : result.services || [],
      ethnicity: result.ethnicity,
      orientation: result.orientation,
      eye_color: result.eye_color,
      hair_color: result.hair_color,
      hair_length: result.hair_length,
      pubic_hair: result.pubic_hair,
      bust_size: result.bust_size,
      bust_type: result.bust_type,
      smoker: result.smoker,
      tattoo: result.tattoo,
      piercing: result.piercing,
      travel: result.travel,
      available_for: result.available_for,
      meeting_with: result.meeting_with,
      profile_type: result.profile_type,
      rates: result.rates,
      services_detailed: result.services_detailed,
      working_time: result.working_time,
      working_timezone: result.working_timezone,
      video_url: result.video,
      images: result.images,
    }
  })
}

function parseEuroGirlsEscort($: CheerioDoc, url: string) {
  // ── Name ──────────────────────────────────────────────────────────────────
  // EGE title format: "Name escort type - City / Country" — extract just first name
  let name = $("h1").first().text().trim() || $("[class*=name]").first().text().trim()
  // Remove suffixes like "pornstar escort - Budapest / Hungary", "escort - City / Country"
  name = name.replace(/\s*(pornstar|escort|massage|trans|couple|independent|agency).*$/i, "").trim()
  name = name.split(",")[0].trim()

  // ── Description ──────────────────────────────────────────────────────────
  // Skip EGE's legal disclaimer text (starts with "EuroGirlsEscort.com" or "18 years")
  const legalKeywords = ["eurogirlsescort.com", "sexually explicit", "18 years", "must leave", "age of majority", "legal age"]
  let description = ""
  $(".about-text, .profile-description, .bio, [class*=about] p, [class*=description] p, [class*=bio] p, p").each((_i, el) => {
    const txt = $(el).text().trim()
    if (txt.length > 80 && !description) {
      const lower = txt.toLowerCase()
      if (!legalKeywords.some(k => lower.includes(k))) {
        description = txt
      }
    }
  })
  description = description.slice(0, 2000)

  // ── Profile attribute table ───────────────────────────────────────────────
  // EGE renders profile info as rows with <span>Label:</span><strong>Value</strong>
  // OR as table rows <td>Label</td><td><a>Value</a></td>
  const attrs: Record<string, string> = {}

  // Method 1: span + strong sibling pattern
  $("span").each((_i, el) => {
    const txt = $(el).text().trim()
    if (txt.endsWith(":")) {
      const label = txt.slice(0, -1).toLowerCase().trim()
      const $parent = $(el).parent()
      const value =
        $(el).next("strong").text().trim() ||
        $(el).next("a").text().trim() ||
        $parent.find("strong").not($(el).find("strong")).first().text().trim() ||
        $parent.children().not(el).first().text().trim()
      if (label && value && value.length < 100) attrs[label] = value
    }
  })

  // Method 2: table rows
  $("tr").each((_i, el) => {
    const cells = $(el).find("td")
    if (cells.length >= 2) {
      const label = $(cells[0]).text().replace(":", "").trim().toLowerCase()
      const value = $(cells[1]).text().trim() || $(cells[1]).find("a").first().text().trim()
      if (label && value && !attrs[label]) attrs[label] = value
    }
  })

  // Method 3: definition lists
  $("dt").each((_i, el) => {
    const label = $(el).text().replace(":", "").trim().toLowerCase()
    const value = $(el).next("dd").text().trim()
    if (label && value && !attrs[label]) attrs[label] = value
  })

  // ── Extract all standard fields ───────────────────────────────────────────
  const age = attrs["age"] || $("[class*=age]").first().text().replace(/\D/g, "").trim()
  const locationRaw = attrs["location"] || ""
  const city = attrs["city"] || locationRaw.split("/")[0]?.trim() || ""
  const country = attrs["country"] || locationRaw.split("/")[1]?.trim() || ""

  const height = attrs["height"]?.match(/\d+/)?.[0] || ""
  const weight = attrs["weight"]?.match(/\d+/)?.[0] || ""
  const nationality = attrs["nationality"] || ""
  const ethnicity = attrs["ethnicity"] || ""
  const orientation = attrs["orientation"] || ""
  const eye_color = attrs["eyes"] || attrs["eye color"] || ""
  const hair_color = attrs["hair color"] || attrs["hair"] || ""
  const hair_length = attrs["hair lenght"] || attrs["hair length"] || attrs["hair_length"] || ""
  const pubic_hair = attrs["pubic hair"] || attrs["pubic"] || ""
  const bust_size = attrs["bust size"] || attrs["bra"] || ""
  const bust_type = attrs["bust type"] || ""
  const smoker = attrs["smoker"] || ""
  const tattoo = attrs["tattoo"] || ""
  const piercing = attrs["piercing"] || ""
  const travel = attrs["travel"] || ""
  const available_for = attrs["available for"] || attrs["available"] || ""
  const meeting_with = attrs["meeting with"] || ""
  const profile_type = attrs["escort type"] || attrs["type"] || ""
  const languages = attrs["languages"] || ""
  const servicesText = attrs["services"] || ""

  // ── Rates table ──────────────────────────────────────────────────────────
  // Table: Time | Incall | Outcall
  const rates: { period: string; incall: string; outcall: string }[] = []
  $("table").each((_i, table) => {
    const headers = $(table).find("thead th, tr:first-child th, tr:first-child td")
      .map((_j, el) => $(el).text().toLowerCase().trim()).get()
    const hasIncall = headers.some(h => h.includes("incall"))
    const hasTime = headers.some(h => h.includes("time") || h.includes("hour") || h.includes("hour"))
    if (hasIncall || hasTime) {
      $(table).find("tbody tr, tr:not(:first-child)").each((_j, row) => {
        const cells = $(row).find("td")
        if (cells.length >= 2) {
          const period = $(cells[0]).text().trim()
          const incall = $(cells[1]).text().replace(/[^\d€$£EUR]/gi, "").trim() || $(cells[1]).text().trim()
          const outcall = cells.length >= 3 ? ($(cells[2]).text().replace(/[^\d€$£EUR]/gi, "").trim() || $(cells[2]).text().trim()) : ""
          if (period && (incall || outcall)) {
            // Only add if it looks like a rate row (has a number)
            if (/hour|min|24|48|overnight/i.test(period) || /\d/.test(incall)) {
              rates.push({ period, incall: incall !== "×" ? incall : "", outcall: outcall !== "×" ? outcall : "" })
            }
          }
        }
      })
    }
  })

  // ── Services detailed table ───────────────────────────────────────────────
  // Table: Services | Included | Extra (with optional price)
  const services_detailed: { service: string; type: "included" | "extra"; price: string }[] = []
  const includedServices: string[] = []
  $("table").each((_i, table) => {
    const headers = $(table).find("thead th, tr:first-child th")
      .map((_j, el) => $(el).text().toLowerCase().trim()).get()
    if (headers.some(h => h.includes("included") || h.includes("extra"))) {
      $(table).find("tbody tr, tr:not(:first-child)").each((_j, row) => {
        const cells = $(row).find("td")
        if (cells.length >= 2) {
          const service = $(cells[0]).text().trim()
          if (!service) return
          const includedCell = $(cells[1]).text().trim()
          const extraCell = cells.length >= 3 ? $(cells[2]).text().trim() : ""

          // Check for checkmark symbols (✓, ✔, or just non-empty text that isn't ×)
          const isIncluded = /✓|✔|check|yes/i.test(includedCell) || (includedCell && includedCell !== "×" && includedCell !== "")
          const isExtra = extraCell && extraCell !== "×" && extraCell !== ""

          if (isIncluded) {
            services_detailed.push({ service, type: "included", price: "" })
            includedServices.push(service)
          } else if (isExtra) {
            // Extract price from extra cell
            const priceMatch = extraCell.match(/[\d,]+\s*(?:EUR|USD|GBP|DKK)?/i)
            services_detailed.push({ service, type: "extra", price: priceMatch?.[0] || extraCell })
          }
        }
      })
    }
  })

  // ── Working time ──────────────────────────────────────────────────────────
  const working_time: { day: string; from: string; to: string; all_day: boolean }[] = []
  let working_timezone = ""
  const dayNames = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]

  $("table, [class*=working], [class*=schedule], [class*=hours]").each((_i, el) => {
    const text = $(el).text().toLowerCase()
    if (!dayNames.some(d => text.includes(d))) return

    $(el).find("tr").each((_j, row) => {
      const rowText = $(row).text().trim()
      const dayMatch = dayNames.find(d => rowText.toLowerCase().startsWith(d))
      if (dayMatch) {
        // Time range: "10:00 - 21:00" or "10:00 – 21:00"
        const timeMatch = rowText.match(/(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})/)
        if (timeMatch) {
          working_time.push({ day: dayMatch.charAt(0).toUpperCase() + dayMatch.slice(1), from: timeMatch[1], to: timeMatch[2], all_day: false })
        } else if (/24.{0,3}hour|all day|open 24/i.test(rowText)) {
          working_time.push({ day: dayMatch.charAt(0).toUpperCase() + dayMatch.slice(1), from: "00:00", to: "24:00", all_day: true })
        }
      }
    })

    // Timezone
    const tzMatch = $(el).text().match(/\(GMT[^)]+\)\s*[\w/]+/)
    if (tzMatch && !working_timezone) working_timezone = tzMatch[0].trim()
  })

  // ── Phone ─────────────────────────────────────────────────────────────────
  const phonePartial = $(".opacity-horizontal").first().text().replace(/\u00a0/g, "").trim()
  const phone = phonePartial || ""

  // ── Messaging apps ────────────────────────────────────────────────────────
  const telegram = $("[data-telegram]").first().attr("data-telegram") || ""
  const hasWhatsapp = $(".icon-whatsapp, [class*=whatsapp], [href*=whatsapp]").length > 0
  const hasViber = $("[class*=viber], [href*=viber]").length > 0
  const hasLine = $("[class*=line-app], [href*=line.me]").length > 0
  const hasSignal = $("[class*=signal], [href*=signal.me]").length > 0

  // ── Video ─────────────────────────────────────────────────────────────────
  let video = $("[data-video]").first().attr("data-video") || ""
  if (!video) {
    const rawHtml = $.html()
    const mp4Match = rawHtml.match(/https?:\/\/[^"'\s]+\.mp4/i)
    if (mp4Match) video = mp4Match[0]
  }
  if (!video) {
    video = $("video source").first().attr("src") || $("video").first().attr("src") || ""
  }

  // ── Images ────────────────────────────────────────────────────────────────
  const images: string[] = []
  const adDomains = ["escortmodels", "escortmod", "banner", "advert", "sponsor", "affiliate", "promo", "ads."]
  $("[class*=gallery] img, [class*=slider] img, [class*=photo] img, [class*=album] img, .swiper-slide img, .owl-item img, [class*=carousel] img").each((_i, el) => {
    const src = $(el).attr("data-src") || $(el).attr("data-lazy") || $(el).attr("src") || ""
    if (!src.startsWith("http")) return
    if (adDomains.some(d => src.toLowerCase().includes(d))) return
    if (!images.includes(src)) images.push(src)
  })
  if (images.length === 0) {
    $("img[src*='escorts'], img[src*='profile'], img[src*='photo'], img[data-src]").each((_i, el) => {
      const src = $(el).attr("data-src") || $(el).attr("src") || ""
      if (!src.startsWith("http")) return
      if (adDomains.some(d => src.toLowerCase().includes(d))) return
      if (!images.includes(src)) images.push(src)
    })
  }

  return {
    name, age, city, country, phone, telegram, hasWhatsapp, hasViber, hasLine, hasSignal,
    description, images: images.slice(0, 20), video,
    height, weight, nationality, languages, services: servicesText,
    ethnicity, orientation, eye_color, hair_color, hair_length, pubic_hair,
    bust_size, bust_type, smoker, tattoo, piercing, travel,
    available_for, meeting_with, profile_type,
    rates, services_detailed, includedServices,
    working_time, working_timezone,
    source_url: url,
    // Raw attrs for debugging
    _attrs: attrs,
  }
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
