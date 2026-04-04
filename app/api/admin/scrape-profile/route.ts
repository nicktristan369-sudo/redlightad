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

  // Bred billed-selektor der dækker escortguide.dk, annoncelight.dk og andre sites
  const images = $('img')
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
    .filter((src, i, arr) => arr.indexOf(src) === i)
    .slice(0, 8)

  // Find video-URLs (MP4)
  const videos = $('a[href*=".mp4"], source[src*=".mp4"]')
    .map((_, el) => $(el).attr('href') || $(el).attr('src') || '')
    .get()
    .concat(
      // escortguide.dk gemmer video URL i data-attributter eller href på thumbnails
      $('[data-thumb*="Videos"], a[data-src*=".mp4"], a[href*="Videos"]')
        .map((_, el) => {
          const href = $(el).attr('href') || ''
          // Konverter thumbnail URL til MP4: /Content/Videos/ID/VID/VID_thumbnail.jpg → /Content/Videos/ID/VID/VID.mp4
          if (href.includes('Videos') && !href.includes('.mp4')) {
            return href.replace(/_thumbnail\.(jpg|png)$/, '.mp4')
          }
          return href.includes('.mp4') ? href : ''
        })
        .get()
    )
    .filter((src): src is string => !!src && src.includes('.mp4'))
    .map(src => src.startsWith('/') ? baseUrl + src : src)
    .filter((src, i, arr) => arr.indexOf(src) === i)
    .slice(0, 5)

  return Response.json({
    profile: { display_name, phone, description, city, age, images, videos, source_url: url }
  })
}
