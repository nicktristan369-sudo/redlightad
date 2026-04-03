import { NextRequest } from 'next/server'
import axios from 'axios'

export async function POST(req: NextRequest) {
  const { url } = await req.json()

  const { data: html } = await axios.get(url, {
    timeout: 10000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    },
  })

  // Udtræk alle tel: links
  const telLinks = [...(html as string).matchAll(/href=["']tel:([^"']+)["']/g)]
    .map((m: RegExpMatchArray) => m[1])

  // Udtræk alle 8-cifrede tal
  const allNumbers = [...(html as string).matchAll(/\b\d{8}\b/g)]
    .map((m: RegExpMatchArray) => m[0])

  // Vis første 2000 tegn af HTML
  const preview = (html as string).slice(0, 2000)

  return Response.json({ telLinks, allNumbers, preview })
}
