import { NextRequest } from 'next/server'
import sharp from 'sharp'

export async function GET(req: NextRequest) {
  const apiKey = process.env.CLIPDROP_API_KEY
  if (!apiKey) return Response.json({ error: 'CLIPDROP_API_KEY not set' }, { status: 500 })

  const testUrl = req.nextUrl.searchParams.get('url') || 'https://annoncelight.dk/storage/images/Ly9fWKKfQexaEuz8vrE7AaoE4B2Mrs8qIMEgs3qo.jpg'

  try {
    // Download billede
    const imgRes = await fetch(testUrl, {
      headers: { 'Referer': 'https://annoncelight.dk/', 'User-Agent': 'Mozilla/5.0' }
    })
    if (!imgRes.ok) return Response.json({ error: `Download failed: ${imgRes.status}` })
    const imgBuf = Buffer.from(await imgRes.arrayBuffer())

    const meta = await sharp(imgBuf).metadata()
    const w = meta.width || 800
    const h = meta.height || 600

    const wmX = 0
    const wmY = Math.round(h * 0.43)
    const wmW = w
    const wmH = Math.round(h * 0.12)

    // Lav mask
    const maskBuf = await sharp({ create: { width: w, height: h, channels: 3, background: { r: 0, g: 0, b: 0 } } })
      .composite([{
        input: await sharp({ create: { width: wmW, height: wmH, channels: 3, background: { r: 255, g: 255, b: 255 } } }).png().toBuffer(),
        left: wmX, top: wmY,
      }]).png().toBuffer()

    const form = new FormData()
    form.append('image_file', new Blob([imgBuf.buffer as ArrayBuffer], { type: 'image/jpeg' }), 'image.jpg')
    form.append('mask_file', new Blob([maskBuf.buffer as ArrayBuffer], { type: 'image/png' }), 'mask.png')
    form.append('mode', 'quality')

    const res = await fetch('https://clipdrop-api.co/cleanup/v1', {
      method: 'POST',
      headers: { 'x-api-key': apiKey },
      body: form,
      signal: AbortSignal.timeout(60000),
    })

    if (!res.ok) {
      const err = await res.text()
      return Response.json({ error: err, status: res.status, image_size: `${w}x${h}`, mask: { x: wmX, y: wmY, w: wmW, h: wmH } })
    }

    // Returner det rensede billede direkte
    const resultBuf = await res.arrayBuffer()
    return new Response(resultBuf, {
      headers: { 'Content-Type': 'image/png', 'Cache-Control': 'no-cache' }
    })

  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
