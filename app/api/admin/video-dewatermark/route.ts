import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

const UW_KEY = process.env.UNWATERMARK_API_KEY!
const UW_VIDEO_CREATE = 'https://api.unwatermark.ai/api/unwatermark/api/v1/ai-manual-remove-video/create-job'
const UW_VIDEO_STATUS = 'https://api.unwatermark.ai/api/unwatermark/api/v1/ai-manual-remove-video/get-job'

const getAdmin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ── Parse video dimensions from MP4 moov atom ────────────────────────────────
async function getVideoDimensions(videoUrl: string): Promise<{ w: number; h: number }> {
  const res = await fetch(videoUrl, { headers: { Range: 'bytes=0-131071' } })
  const buf = Buffer.from(await res.arrayBuffer())
  let pos = 0
  while (pos < buf.length - 4) {
    const idx = buf.indexOf(Buffer.from('tkhd'), pos)
    if (idx < 0) break
    const boxStart = idx - 4
    // Width at tkhd+84, Height at tkhd+88 (fixed 16.16 format)
    if (boxStart + 92 < buf.length) {
      const w = buf.readUInt32BE(boxStart + 84) >> 16
      const h = buf.readUInt32BE(boxStart + 88) >> 16
      if (w > 0 && h > 0 && w < 4000 && h < 4000) return { w, h }
    }
    pos = idx + 4
  }
  return { w: 848, h: 480 } // fallback
}

// ── Generate mask PNG for watermark region ───────────────────────────────────
// Returns black image with white rectangle where watermark is
function getWatermarkRegion(domain: string, w: number, h: number): { x: number; y: number; bw: number; bh: number } {
  if (domain.includes('escortguide')) {
    // Escortguide: "ESCORTGUIDE" text i bund-centrum (~65–82% fra top)
    return { x: 0, y: Math.round(h * 0.62), bw: w, bh: Math.round(h * 0.22) }
  }
  if (domain.includes('nympho')) {
    // Nympho.dk: vandmærke typisk i nedre centrum
    return { x: 0, y: Math.round(h * 0.60), bw: w, bh: Math.round(h * 0.25) }
  }
  // Default: nedre tredjedel
  return { x: 0, y: Math.round(h * 0.60), bw: w, bh: Math.round(h * 0.25) }
}

async function generateMask(w: number, h: number, region: { x: number; y: number; bw: number; bh: number }): Promise<Buffer> {
  // Black base
  const base = await (sharp as any)({ create: { width: w, height: h, channels: 1, background: { r: 0, g: 0, b: 0 } } })
    .grayscale()
    .raw()
    .toBuffer()
  // Create raw pixel buffer — black bg + white rectangle
  const pixels = Buffer.alloc(w * h, 0)
  for (let y = region.y; y < region.y + region.bh && y < h; y++) {
    for (let x = region.x; x < region.x + region.bw && x < w; x++) {
      pixels[y * w + x] = 255
    }
  }
  void base // suppress unused warning
  const maskPng = await (sharp as any)(pixels, { raw: { width: w, height: h, channels: 1 } })
    .png()
    .toBuffer()
  return maskPng
}

async function uploadMask(buf: Buffer, filename: string): Promise<string> {
  const supabase = getAdmin()
  const { error } = await supabase.storage
    .from('media')
    .upload(`masks/${filename}`, buf, { contentType: 'image/png', upsert: true })
  if (error) throw new Error('Mask upload failed: ' + error.message)
  const { data } = supabase.storage.from('media').getPublicUrl(`masks/${filename}`)
  return data.publicUrl
}

// ── POST: Start watermark removal job ────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { videoUrl, videoId } = await req.json()
    if (!videoUrl) return NextResponse.json({ error: 'videoUrl påkrævet' }, { status: 400 })

    const domain = new URL(videoUrl).hostname
    console.log('[dewatermark] Starting for:', videoUrl)

    // 1. Get dimensions
    const { w, h } = await getVideoDimensions(videoUrl)
    console.log('[dewatermark] Dimensions:', w, 'x', h)

    // 2. Generate mask
    const region = getWatermarkRegion(domain, w, h)
    const maskBuf = await generateMask(w, h, region)

    // 3. Upload mask to Supabase Storage
    const maskFilename = `mask-${domain.replace(/\./g, '_')}-${w}x${h}.png`
    const maskUrl = await uploadMask(maskBuf, maskFilename)
    console.log('[dewatermark] Mask URL:', maskUrl)

    // 4. Submit to unwatermark.ai
    const form = new FormData()
    form.append('original_video_url', videoUrl)
    form.append('mask_url', maskUrl)

    const uwRes = await fetch(UW_VIDEO_CREATE, {
      method: 'POST',
      headers: { 'ZF-API-KEY': UW_KEY },
      body: form,
    })
    const uwData = await uwRes.json()
    console.log('[dewatermark] UW response:', JSON.stringify(uwData))

    if (uwData.code !== 100000 || !uwData.result?.job_id) {
      return NextResponse.json({ error: 'UW API fejl: ' + JSON.stringify(uwData.message) }, { status: 500 })
    }

    const jobId = uwData.result.job_id
    const credits = uwData.result.deduct_credits

    // 5. Store job_id in Supabase if videoId provided
    if (videoId) {
      const supabase = getAdmin()
      await supabase.from('listing_videos').update({ title: `[processing:${jobId}]` }).eq('id', videoId)
    }

    return NextResponse.json({ ok: true, jobId, credits, dimensions: { w, h }, maskUrl })

  } catch (e) {
    console.error('[dewatermark] Error:', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

// ── GET: Poll job status ──────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const jobId = searchParams.get('job_id')
  const videoId = searchParams.get('video_id')

  if (!jobId) return NextResponse.json({ error: 'job_id påkrævet' }, { status: 400 })

  const res = await fetch(`${UW_VIDEO_STATUS}/${jobId}`, {
    headers: { 'ZF-API-KEY': UW_KEY },
  })
  const data = await res.json()
  console.log('[dewatermark poll]', jobId, data.code)

  if (data.code === 100000) {
    // Completed — update DB
    const outputUrl = data.result?.output_url?.[0]
    if (outputUrl && videoId) {
      const supabase = getAdmin()
      await supabase.from('listing_videos').update({ url: outputUrl, title: null }).eq('id', videoId)
    }
    return NextResponse.json({ status: 'done', outputUrl: data.result?.output_url?.[0] })
  }

  if (data.code === 300010) return NextResponse.json({ status: 'processing' })
  if (data.code === 300011) return NextResponse.json({ status: 'failed' })

  return NextResponse.json({ status: 'unknown', code: data.code })
}
