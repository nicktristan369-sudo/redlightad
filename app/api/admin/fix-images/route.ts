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

    // ClipDrop Cleanup — præcise koordinater for AnnonceLight.dk vandmærke
    const clipdropKey = process.env.CLIPDROP_API_KEY
    if (clipdropKey) {
      try {
        const wmX = Math.round(w * 0.02), wmY = Math.round(h * 0.46)
        const wmW = Math.round(w * 0.70), wmH = Math.round(h * 0.08)
        const maskBuf = await sharp({ create: { width: w, height: h, channels: 3, background: { r:0,g:0,b:0 } } })
          .composite([{ input: await sharp({ create: { width: wmW, height: wmH, channels: 3, background: { r:255,g:255,b:255 } } }).png().toBuffer(), left: wmX, top: wmY }])
          .png().toBuffer()
        const form = new FormData()
        form.append('image_file', new Blob([processed.buffer as ArrayBuffer], { type: 'image/jpeg' }), 'image.jpg')
        form.append('mask_file', new Blob([maskBuf.buffer as ArrayBuffer], { type: 'image/png' }), 'mask.png')
        form.append('mode', 'quality')
        const res = await fetch('https://clipdrop-api.co/cleanup/v1', {
          method: 'POST', headers: { 'x-api-key': clipdropKey }, body: form, signal: AbortSignal.timeout(60000),
        })
        if (res.ok) { processed = Buffer.from(await res.arrayBuffer()); console.log('✅ ClipDrop:', imageUrl) }
        else console.error('❌ ClipDrop:', res.status, await res.text())
      } catch (ce) { console.error('ClipDrop error:', ce instanceof Error ? ce.message : ce) }
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
