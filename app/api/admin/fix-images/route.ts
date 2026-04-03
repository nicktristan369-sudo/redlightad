import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { v2 as cloudinary } from 'cloudinary'
import sharp from 'sharp'

export const maxDuration = 300

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const getSupabase = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function cropAndUpload(imageUrl: string): Promise<string> {
  try {
    // Download
    const res = await fetch(imageUrl, { signal: AbortSignal.timeout(15000) })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const buffer = Buffer.from(await res.arrayBuffer())

    const meta = await sharp(buffer).metadata()
    const w = meta.width || 800
    const h = meta.height || 600

    // Forbedr kvalitet
    let processed = await sharp(buffer)
      .modulate({ saturation: 1.2, brightness: 1.03 })
      .sharpen()
      .jpeg({ quality: 90 })
      .toBuffer()

    // Replicate inpainting — fjern AnnonceLight vandmærke (midt i billedet)
    const token = process.env.REPLICATE_API_TOKEN
    if (token) {
      try {
        const maskBuf = await sharp({ create: { width: w, height: h, channels: 3, background: { r: 0, g: 0, b: 0 } } })
          .composite([{ input: await sharp({ create: { width: Math.round(w*0.75), height: Math.round(h*0.22), channels: 3, background: { r:255,g:255,b:255 } } }).png().toBuffer(), left: Math.round(w*0.05), top: Math.round(h*0.33) }])
          .png().toBuffer()
        const sr = await fetch('https://api.replicate.com/v1/predictions', {
          method: 'POST',
          headers: { 'Authorization': `Token ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ version: '95b7223104132402a9ae91cc677285bc5eb997834bd2349fa486f53910fd68b3', input: { image: `data:image/jpeg;base64,${processed.toString('base64')}`, mask: `data:image/png;base64,${maskBuf.toString('base64')}`, prompt: 'smooth skin, clean background, no text', num_inference_steps: 25 } }),
        })
        if (sr.ok) {
          const pred = await sr.json()
          for (let i = 0; i < 20; i++) {
            await new Promise(r => setTimeout(r, 2000))
            const pr = await (await fetch(`https://api.replicate.com/v1/predictions/${pred.id}`, { headers: { 'Authorization': `Token ${token}` } })).json()
            if (pr.status === 'succeeded' && pr.output) {
              const out = Array.isArray(pr.output) ? pr.output[0] : pr.output
              const ir = await fetch(out)
              if (ir.ok) { processed = Buffer.from(await ir.arrayBuffer()); console.log('✅ WM removed:', imageUrl); break }
            }
            if (pr.status === 'failed') break
          }
        }
      } catch (re) { console.error('Replicate error:', re instanceof Error ? re.message : re) }
    }

    // Upload til Cloudinary
    const url = await new Promise<string>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: 'listings', resource_type: 'image', quality: 'auto:best' },
        (error, result) => error ? reject(error) : resolve(result!.secure_url)
      ).end(processed)
    })

    return url
  } catch (e) {
    console.error('cropAndUpload failed:', imageUrl, e instanceof Error ? e.message : e)
    return imageUrl // returner original ved fejl
  }
}

export async function GET(req: NextRequest) {
  const supabase = getSupabase()
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (msg: string) => {
        controller.enqueue(encoder.encode(`data: ${msg}\n\n`))
      }

      try {
        // Hent alle listings med billeder
        const { data: listings, error } = await supabase
          .from('listings')
          .select('id, display_name, images, profile_image')
          .not('images', 'is', null)
          .neq('images', '{}')

        if (error) throw error

        send(`Fundet ${listings?.length || 0} profiler med billeder`)

        let updated = 0
        let skipped = 0

        for (const listing of listings || []) {
          if (!listing.images || listing.images.length === 0) { skipped++; continue }

          send(`Behandler: ${listing.display_name || listing.id}...`)

          const newImages: string[] = []
          for (const imgUrl of listing.images) {
            // Behandl ALLE billeder — også Cloudinary (kan have vandmærke fra før fix)
            const newUrl = await cropAndUpload(imgUrl)
            newImages.push(newUrl)
          }

          // Opdater listing
          await supabase
            .from('listings')
            .update({
              images: newImages,
              profile_image: newImages[0] || listing.profile_image,
            })
            .eq('id', listing.id)

          updated++
          send(`✅ ${listing.display_name || listing.id} — ${newImages.length} billeder opdateret`)
        }

        send(`\nFærdig! ${updated} profiler opdateret, ${skipped} sprunget over.`)
      } catch (e) {
        send(`Fejl: ${e instanceof Error ? e.message : String(e)}`)
      } finally {
        controller.close()
      }
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
