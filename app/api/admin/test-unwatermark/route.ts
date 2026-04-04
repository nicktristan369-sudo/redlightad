import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"
export const maxDuration = 120

export async function GET() {
  const uwKey = process.env.UNWATERMARK_API_KEY
  if (!uwKey) return NextResponse.json({ error: 'UNWATERMARK_API_KEY mangler' }, { status: 500 })

  // Hent testbillede fra escortguide.dk
  const testUrl = 'https://escortguide.dk/Content/Pictures/75756/2234675_large.jpg'
  const imgRes = await fetch(testUrl, {
    headers: { 'Referer': 'https://escortguide.dk/', 'User-Agent': 'Mozilla/5.0' }
  })
  if (!imgRes.ok) return NextResponse.json({ error: `Kunne ikke hente testbillede: ${imgRes.status}` })

  const imageBuffer = Buffer.from(await imgRes.arrayBuffer())
  const ab = imageBuffer.buffer.slice(imageBuffer.byteOffset, imageBuffer.byteOffset + imageBuffer.byteLength)

  const form = new FormData()
  form.append('original_image_file', new Blob([ab], { type: 'image/jpeg' }), 'image.jpg')
  form.append('is_remove_text', 'true')
  form.append('is_remove_logo', 'true')
  form.append('output_format', 'jpg')

  const res = await fetch('https://api.unwatermark.ai/api/web/v1/sync/auto-unwatermark-upgrade-api/creat-job', {
    method: 'POST',
    headers: { 'ZF-API-KEY': uwKey },
    body: form,
    signal: AbortSignal.timeout(110000),
  })

  const text = await res.text()
  let data: unknown
  try { data = JSON.parse(text) } catch { data = text }

  return NextResponse.json({
    status: res.status,
    ok: res.ok,
    response: data,
    keyPrefix: uwKey.substring(0, 8) + '...',
    imageSizeKB: Math.round(imageBuffer.length / 1024),
  })
}
