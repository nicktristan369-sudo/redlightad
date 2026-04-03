import { NextRequest } from 'next/server'
import sharp from 'sharp'

export async function GET(req: NextRequest) {
  const apiKey = process.env.CLIPDROP_API_KEY
  if (!apiKey) return Response.json({ error: 'CLIPDROP_API_KEY not set' }, { status: 500 })

  try {
    // Lav et simpelt 100x100 test-billede
    const img = await sharp({
      create: { width: 100, height: 100, channels: 3, background: { r: 200, g: 150, b: 150 } }
    }).jpeg().toBuffer()

    // Lav en lille hvid mask
    const mask = await sharp({
      create: { width: 100, height: 100, channels: 3, background: { r: 0, g: 0, b: 0 } }
    }).composite([{
      input: await sharp({ create: { width: 60, height: 10, channels: 3, background: { r: 255, g: 255, b: 255 } } }).png().toBuffer(),
      left: 20, top: 45
    }]).png().toBuffer()

    const form = new FormData()
    form.append('image_file', new Blob([img.buffer as ArrayBuffer], { type: 'image/jpeg' }), 'image.jpg')
    form.append('mask_file', new Blob([mask.buffer as ArrayBuffer], { type: 'image/png' }), 'mask.png')
    form.append('mode', 'quality')

    const res = await fetch('https://clipdrop-api.co/cleanup/v1', {
      method: 'POST',
      headers: { 'x-api-key': apiKey },
      body: form,
      signal: AbortSignal.timeout(30000),
    })

    const text = res.ok ? 'OK' : await res.text()
    return Response.json({
      status: res.status,
      ok: res.ok,
      content_type: res.headers.get('content-type'),
      error: res.ok ? null : text,
      api_key_set: true,
      api_key_prefix: apiKey.substring(0, 8) + '...',
    })
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
