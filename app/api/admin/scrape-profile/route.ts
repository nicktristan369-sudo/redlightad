import { NextRequest } from 'next/server'
import * as cheerio from 'cheerio'

export async function POST(req: NextRequest) {
  const { url } = await req.json()

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml',
      'Accept-Language': 'da-DK,da;q=0.9',
    },
    signal: AbortSignal.timeout(10000),
  })

  const html = await res.text()
  const $ = cheerio.load(html)

  const display_name = $('h1').first().text().trim() ||
    $('[class*="name"]').first().text().trim() || ''

  const telLink = $('a[href^="tel:"]').first().attr('href')
  let phone = ''
  if (telLink) {
    phone = telLink.replace('tel:', '').trim()
  } else {
    const match = html.match(/(?:\+?45)?[\s]?\d{2}[\s]?\d{2}[\s]?\d{2}[\s]?\d{2}/)
    phone = match ? match[0].replace(/\s/g, '') : ''
  }

  const description = (() => {
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

  function getFullSizeUrl(src: string): string {
    // Gør relative URLs absolutte
    if (src.startsWith('/')) src = baseUrl + src
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

  // escortguide.dk: billeder er i <a data-media-type="1" href="/Content/Pictures/...">
  const escortguideImages = $('a[data-media-type="1"]')
    .map((_, el) => $(el).attr('href') || '')
    .get()
    .filter(src => !!src)
    .map(src => src.startsWith('/') ? baseUrl + src : src)

  // Generisk selector for andre sites
  const genericImages = $('img')
    .map((_, el) => $(el).attr('src') || $(el).attr('data-src') || '')
    .get()
    .filter((src): src is string =>
      !!src &&
      (src.includes('Pictures') || src.includes('storage') || src.includes('upload') ||
       src.includes('photo') || src.includes('image') || src.includes('foto')) &&
      !src.includes('logo') && !src.includes('icon') && !src.includes('flag') &&
      !src.includes('avatar') && !src.includes('banner') && !src.includes('thumb')
    )
    .map(getFullSizeUrl)

  const images = [...new Set([...escortguideImages, ...genericImages])].slice(0, 8)

  // Find video-URLs — escortguide.dk bruger data-media-type="2" for videoer
  const videos = $('a[data-media-type="2"], a[href*=".mp4"], source[src*=".mp4"]')
    .map((_, el) => $(el).attr('href') || $(el).attr('src') || '')
    .get()
    .filter((src): src is string => !!src)
    .map(src => src.startsWith('/') ? baseUrl + src : src)
    .filter(src => src.includes('.mp4') || src.includes('Videos'))
    .filter((src, i, arr) => arr.indexOf(src) === i)
    .slice(0, 5)

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
