import { NextRequest } from 'next/server'
import * as cheerio from 'cheerio'

export async function POST(req: NextRequest) {
  const { url } = await req.json()

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'da-DK,da;q=0.9,en-US;q=0.8,en;q=0.7',
      'Accept-Encoding': 'gzip, deflate, br',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Sec-Ch-Ua': '"Chromium";v="124", "Google Chrome";v="124"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Windows"',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1',
      'Referer': new URL(url).origin,
    },
    signal: AbortSignal.timeout(15000),
  })

  const html = await res.text()
  console.log(`[scrape] ${url} → status=${res.status} size=${html.length} isNympho=${new URL(url).hostname.includes('nympho')}`)
  const $ = cheerio.load(html)

  const display_name = (isNympho
    ? $('.client_name').first().text().trim() || $('h1').first().text().trim()
    : $('h1').first().text().trim() || $('[class*="name"]').first().text().trim()
  ) || ''

  const telLink = $('a[href^="tel:"]').first().attr('href')
  let phone = ''
  if (telLink) {
    phone = telLink.replace('tel:', '').trim()
  } else {
    const match = html.match(/(?:\+?45)?[\s]?\d{2}[\s]?\d{2}[\s]?\d{2}[\s]?\d{2}/)
    phone = match ? match[0].replace(/\s/g, '') : ''
  }

  const description = (() => {
    if (isNympho) {
      // Nympho.dk: beskrivelse er i .description, .profile-text, eller lange <p> tags
      const nymphoCandidates = [
        $('.description').text().trim(),
        $('.profile-text').text().trim(),
        $('[class*="description"]').not('[class*="meta"]').first().text().trim(),
        $('p').filter((_, el) => {
          const text = $(el).text()
          return text.length > 80
        }).first().text().trim(),
      ]
      return nymphoCandidates.find(c => c && c.length > 30) || ''
    }
    const candidates = [
      $('[class*="desc"]').text().trim(),
      $('[class*="about"]').text().trim(),
      $('[class*="bio"]').text().trim(),
      $('p').filter((_, el) => {
        const text = $(el).text()
        return text.length > 50 && !text.match(/I dag|kl\s+\d{2}:\d{2}|^\d{2}\/\d{2}/)
      }).first().text().trim(),
    ]
    return candidates.find(c => c && c.length > 30) || ''
  })()

  const city = $('[class*="city"]').first().text().trim() ||
    $('[class*="location"]').first().text().trim() || ''

  const ageMatch = html.match(/(\d{2})\s*(år|years|yo)/i)
  const age = ageMatch ? parseInt(ageMatch[1]) : null

  const baseUrl = new URL(url).origin
  const isNympho = url.includes('nympho.dk')
  const isEscortguide = url.includes('escortguide.dk')

  function toAbsolute(src: string): string {
    if (!src) return ''
    if (src.startsWith('http')) return src
    if (src.startsWith('//')) return 'https:' + src
    if (src.startsWith('/')) return baseUrl + src
    return baseUrl + '/' + src
  }

  function getFullSizeUrl(src: string): string {
    src = toAbsolute(src)
    return src
      .replace('.superad.jpg', '.jpg')
      .replace('.superad.png', '.png')
      .replace('.thumb.jpg', '.jpg')
      .replace('.thumb.png', '.png')
      .replace('_small.', '_large.')
      .replace('_medium.', '_large.')
      .replace('/thumbs/', '/images/')
      .replace('/storage/images/thumbs/', '/storage/images/')
  }

  let images: string[] = []
  let videos: string[] = []

  if (isNympho) {
    // ── NYMPHO.DK ──────────────────────────────────────────────
    // Profile image: <img src="/_pictures/ads/m/ID.webp">
    const profileImg = $('img[src*="/_pictures/ads/m/"]').first().attr('src')
    if (profileImg) images.push(toAbsolute(profileImg))

    // Gallery images: data-src="_pictures/ads/s/ID.webp" → upgrade /s/ to /m/
    $('[data-src*="_pictures/ads/s/"], [data-src*="/_pictures/ads/s/"]').each((_, el) => {
      const src = $(el).attr('data-src') || ''
      if (src) {
        const full = toAbsolute(src).replace('/_pictures/ads/s/', '/_pictures/ads/m/').replace('_pictures/ads/s/', '/_pictures/ads/m/')
        images.push(full)
      }
    })

    // Feed images: data-src with /_pictures/feed/
    $('[data-src*="_pictures/feed/"]').each((_, el) => {
      const src = $(el).attr('data-src') || ''
      if (src) {
        const full = toAbsolute(src).replace('/_pictures/feed/md/', '/_pictures/feed/l/').replace('_pictures/feed/md/', '/_pictures/feed/l/')
        images.push(full)
      }
    })

    // Videos: data-src="/_pictures/ads/video/ID.mp4"
    $('[data-src*="_pictures/ads/video/"]').each((_, el) => {
      const src = $(el).attr('data-src') || ''
      if (src) videos.push(toAbsolute(src))
    })
    // Also check href
    $('a[href*="_pictures/ads/video/"], a[href*="/video/"]').each((_, el) => {
      const href = $(el).attr('href') || ''
      if (href.includes('.mp4')) videos.push(toAbsolute(href))
    })

    images = [...new Set(images)].slice(0, 12)
    videos = [...new Set(videos)].slice(0, 6)

  } else if (isEscortguide) {
    // ── ESCORTGUIDE.DK ─────────────────────────────────────────
    images = $('a[data-media-type="1"]')
      .map((_, el) => toAbsolute($(el).attr('href') || ''))
      .get()
      .filter(Boolean)
      .slice(0, 8)

    videos = $('a[data-media-type="2"], a[href*=".mp4"], source[src*=".mp4"]')
      .map((_, el) => toAbsolute($(el).attr('href') || $(el).attr('src') || ''))
      .get()
      .filter(src => src.includes('.mp4'))
      .filter((v, i, a) => a.indexOf(v) === i)
      .slice(0, 5)

  } else {
    // ── GENERISK ───────────────────────────────────────────────
    const genericImages = $('img')
      .map((_, el) => $(el).attr('src') || $(el).attr('data-src') || '')
      .get()
      .filter((src): src is string =>
        !!src &&
        (src.includes('Pictures') || src.includes('storage') || src.includes('upload') ||
         src.includes('photo') || src.includes('image') || src.includes('foto')) &&
        !src.includes('logo') && !src.includes('icon') && !src.includes('flag') &&
        !src.includes('avatar') && !src.includes('banner')
      )
      .map(getFullSizeUrl)

    images = [...new Set(genericImages)].slice(0, 8)
    videos = $('a[href*=".mp4"], source[src*=".mp4"], video[src*=".mp4"]')
      .map((_, el) => toAbsolute($(el).attr('href') || $(el).attr('src') || ''))
      .get()
      .filter(src => src.includes('.mp4'))
      .filter((v, i, a) => a.indexOf(v) === i)
      .slice(0, 5)
  }

  // Hent stories fra escortguide.dk
  let stories: { media_url: string; media_type: string; thumbnail_url: string; duration: number }[] = []
  const profileIdMatch = url.match(/\/annonce\/(\d+)/)
  if (profileIdMatch && url.includes('escortguide.dk')) {
    try {
      const storiesRes = await fetch(`https://escortguide.dk/Global/StoriesGetProfiles.aspx?profileid=${profileIdMatch[1]}`, {
        headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://escortguide.dk/' },
        signal: AbortSignal.timeout(8000),
      })
      if (storiesRes.ok) {
        const storiesData = await storiesRes.json()
        const profile = storiesData.find((p: { id: number }) => p.id === parseInt(profileIdMatch[1]))
        if (profile?.stories) {
          stories = profile.stories.map((s: { type: string; mediaUrl: string; thumbUrl: string; duration: number }) => ({
            media_url: s.mediaUrl.startsWith('/') ? baseUrl + s.mediaUrl : s.mediaUrl,
            media_type: s.type,
            thumbnail_url: s.thumbUrl ? (s.thumbUrl.startsWith('/') ? baseUrl + s.thumbUrl : s.thumbUrl) : '',
            duration: s.duration || 5,
          }))
        }
      }
    } catch (e) { console.error('Stories fetch error:', e instanceof Error ? e.message : e) }
  }

  return Response.json({
    profile: { display_name, phone, description, city, age, images, videos, stories, source_url: url }
  })
}
