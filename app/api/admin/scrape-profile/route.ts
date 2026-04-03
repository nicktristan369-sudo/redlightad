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

  const description = $('[class*="description"]').first().text().trim() ||
    $('[class*="about"]').first().text().trim() ||
    $('p').eq(1).text().trim() || ''

  const city = $('[class*="city"]').first().text().trim() ||
    $('[class*="location"]').first().text().trim() || ''

  const ageMatch = html.match(/(\d{2})\s*(år|years|yo)/i)
  const age = ageMatch ? parseInt(ageMatch[1]) : null

  const images = $('img[src*="upload"], img[src*="photo"], img[src*="image"]')
    .map((_, el) => $(el).attr('src'))
    .get()
    .filter((src): src is string => !!src && !src.includes('logo') && !src.includes('icon'))
    .slice(0, 5)

  return Response.json({
    profile: { display_name, phone, description, city, age, images, source_url: url }
  })
}
