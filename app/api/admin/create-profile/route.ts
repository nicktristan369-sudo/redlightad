import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendSMS } from '@/lib/sms'
import { v2 as cloudinary } from 'cloudinary'
import sharp from 'sharp'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

console.log('Cloudinary config:', {
  cloud_name: (process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) ? 'SET' : 'MISSING',
  api_key: process.env.CLOUDINARY_API_KEY ? 'SET' : 'MISSING',
  api_secret: process.env.CLOUDINARY_API_SECRET ? 'SET' : 'MISSING',
})

async function processImage(imageBuffer: Buffer): Promise<Buffer> {
  try {
    const meta = await sharp(imageBuffer).metadata()
    const w = meta.width || 800
    const h = meta.height || 600

    // Crop bunden væk — AnnonceLight vandmærket sidder i en banner i bunden (~15% af højden)
    const cropH = Math.round(h * 0.82) // crop 18% fra bunden — sikrer vandmærket er væk

    return await sharp(imageBuffer)
      .extract({ left: 0, top: 0, width: w, height: cropH })
      .modulate({ saturation: 1.2, brightness: 1.03 })
      .sharpen()
      .jpeg({ quality: 90 })
      .toBuffer()
  } catch {
    return imageBuffer
  }
}

async function removeWatermark(imageBuffer: Buffer): Promise<Buffer> {
  const replicateToken = process.env.REPLICATE_API_TOKEN
  if (!replicateToken) return imageBuffer

  try {
    const base64 = imageBuffer.toString('base64')
    const dataUri = `data:image/jpeg;base64,${base64}`

    // Opret mask — AnnonceLight vandmærket dækker hele billedet som overlay
    // Brug bred mask der dækker center 80% af billedet
    const meta = await sharp(imageBuffer).metadata()
    const w = meta.width || 800
    const h = meta.height || 600
    const maskX = Math.round(w * 0.05)
    const maskY = Math.round(h * 0.25)
    const maskW = Math.round(w * 0.9)
    const maskH = Math.round(h * 0.5)

    // Sort billede med hvid firkant over vandmærkeområdet
    const maskBuffer = await sharp({
      create: { width: w, height: h, channels: 3, background: { r: 0, g: 0, b: 0 } }
    })
      .composite([{
        input: await sharp({
          create: { width: maskW, height: maskH, channels: 3, background: { r: 255, g: 255, b: 255 } }
        }).png().toBuffer(),
        left: maskX,
        top: maskY,
      }])
      .png()
      .toBuffer()

    const maskDataUri = `data:image/png;base64,${maskBuffer.toString('base64')}`

    // Start Replicate prediction med LaMa inpainting
    const startRes = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${replicateToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: '95b7223104132402a9ae91cc677285bc5eb997834bd2349fa486f53910fd68b3',
        input: {
          image: dataUri,
          mask: maskDataUri,
          prompt: 'clean background, no text, no watermark',
          num_inference_steps: 20,
        },
      }),
    })

    if (!startRes.ok) throw new Error(`Replicate start failed: ${startRes.status}`)
    const prediction = await startRes.json()

    // Poll for resultat (max 30 sek)
    const pollUrl = prediction.urls?.get || `https://api.replicate.com/v1/predictions/${prediction.id}`
    for (let i = 0; i < 15; i++) {
      await new Promise(r => setTimeout(r, 2000))
      const pollRes = await fetch(pollUrl, {
        headers: { 'Authorization': `Token ${replicateToken}` },
      })
      const result = await pollRes.json()

      if (result.status === 'succeeded' && result.output) {
        const imgRes = await fetch(result.output)
        if (imgRes.ok) {
          console.log('✅ Watermark removed via Replicate')
          return Buffer.from(await imgRes.arrayBuffer())
        }
      }
      if (result.status === 'failed') {
        throw new Error('Replicate prediction failed')
      }
    }

    throw new Error('Replicate timeout')
  } catch (e) {
    console.error('❌ Replicate watermark removal failed:', e instanceof Error ? e.message : e)
    return imageBuffer
  }
}

async function removeWatermarkWMR(imageBuffer: Buffer): Promise<Buffer> {
  const apiKey = process.env.WATERMARK_REMOVER_API_KEY
  if (!apiKey) return imageBuffer

  try {
    const formData = new FormData()
    formData.append('image', new Blob([imageBuffer.buffer as ArrayBuffer], { type: 'image/jpeg' }), 'image.jpg')

    const response = await fetch('https://api.watermarkremover.io/v3/remove', {
      method: 'POST',
      headers: { 'x-api-key': apiKey },
      body: formData,
      signal: AbortSignal.timeout(30000),
    })

    if (!response.ok) {
      console.error('❌ WMR failed:', response.status, await response.text())
      return imageBuffer
    }

    const result = await response.arrayBuffer()
    console.log('✅ Watermark removed via watermarkremover.io')
    return Buffer.from(result)
  } catch (e) {
    console.error('❌ WMR error:', e instanceof Error ? e.message : e)
    return imageBuffer
  }
}

async function removeWatermarkPixelbin(imageBuffer: Buffer): Promise<Buffer> {
  const apiToken = process.env.PIXELBIN_API_TOKEN
  if (!apiToken) return imageBuffer

  try {
    const axios = (await import('axios')).default

    // Upload til PixelBin
    const formData = new FormData()
    formData.append('file', new Blob([imageBuffer.buffer as ArrayBuffer], { type: 'image/jpeg' }), `listing_${Date.now()}.jpg`)
    formData.append('path', 'listings')
    formData.append('overwrite', 'true')

    const uploadRes = await axios.post('https://api.pixelbin.io/service/public/assets/v1.0/upload', formData, {
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'multipart/form-data',
      },
      timeout: 30000,
    })

    const uploadedUrl: string = uploadRes.data?.url
    if (!uploadedUrl) throw new Error('No URL returned from PixelBin')

    // Tilføj watermark removal transformation til URL
    const cleanUrl = uploadedUrl.replace('/v2/', '/v2/wm.remove()/')

    // Download rent billede
    const cleanRes = await axios.get(cleanUrl, { responseType: 'arraybuffer', timeout: 20000 })
    console.log('✅ Watermark removed via PixelBin')
    return Buffer.from(cleanRes.data)
  } catch (e) {
    console.error('❌ PixelBin watermark removal failed:', e instanceof Error ? e.message : e)
    return imageBuffer
  }
}

async function uploadImageFromUrl(imageUrl: string): Promise<string> {
  try {
    const axios = (await import('axios')).default
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      headers: {
        'Referer': 'https://annoncelight.dk/',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
      },
      timeout: 15000,
    })

    let imageBuffer = Buffer.from(response.data)

    // Forbedr billedkvalitet
    // processImage cropper bunden og fjerner AnnonceLight vandmærket
    imageBuffer = await processImage(imageBuffer)

    const url = await new Promise<string>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: 'listings', resource_type: 'image', quality: 'auto:best', fetch_format: 'auto' },
        (error, result) => {
          if (error) reject(error)
          else resolve(result!.secure_url)
        }
      ).end(imageBuffer)
    })

    console.log('✅ Image uploaded:', url)
    return url
  } catch (err: unknown) {
    console.error('❌ Image upload failed:', imageUrl, err instanceof Error ? err.message : err)
    return ''
  }
}

const getSupabase = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

function generateCredentials() {
  const loginId = 'user_' + Math.random().toString(36).substring(2, 8)
  const email = `${loginId}@redlightad.com`
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789'
  const password = Array.from(
    { length: 12 },
    () => chars[Math.floor(Math.random() * chars.length)]
  ).join('')
  return { loginId, email, password }
}

export async function POST(req: NextRequest) {
  const { profile, sendSMSNotification } = await req.json()

  const supabase = getSupabase()
  const { loginId, email, password } = generateCredentials()

  // Opret bruger i Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      display_name: profile.display_name,
      login_id: loginId,
      created_by_admin: true,
    },
  })

  if (authError) {
    return Response.json({ error: authError.message }, { status: 500 })
  }

  const userId = authData.user.id

  // Opret profil record
  await supabase.from('profiles').upsert({
    id: userId,
    username: loginId,
    display_name: profile.display_name,
    phone: profile.phone,
    city: profile.city,
    age: profile.age,
    bio: profile.description,
    source_url: profile.source_url,
    created_by_admin: true,
  })

  // Upload billeder til Cloudinary
  const uploadedImages: string[] = []
  if (profile.images && profile.images.length > 0) {
    const results = await Promise.all(
      profile.images.slice(0, 5).map((url: string) => uploadImageFromUrl(url))
    )
    uploadedImages.push(...results.filter(Boolean))
  }

  // Opret listing — gem credentials så admin altid kan finde dem
  const { data: listingData, error: listingError } = await supabase
    .from('listings')
    .insert({
      user_id: userId,
      title: profile.display_name || 'Ny profil',
      display_name: profile.display_name,
      phone: profile.phone,
      city: profile.city || 'København',
      country: profile.country || 'Denmark',
      location: profile.city || 'København',
      age: profile.age || 25,
      gender: profile.gender || 'female',
      about: profile.description,
      source_url: profile.source_url,
      category: profile.category || 'escort',
      status: 'active',
      images: uploadedImages,
      profile_image: uploadedImages[0] || null,
      created_by_admin: true,
      needs_completion: true,
      admin_email: email,
      admin_password: password,
      admin_login_id: loginId,
    })
    .select()

  console.log('Listing insert result:', listingData, listingError)

  if (listingError) {
    console.error('LISTING INSERT ERROR:', JSON.stringify(listingError))
    return Response.json({ error: 'Bruger oprettet men listing fejlede: ' + listingError.message }, { status: 500 })
  }

  // Anvend GRATIS30 promo kode
  const { data: promoCode } = await supabase
    .from('promo_codes')
    .select('id')
    .eq('code', 'GRATIS30')
    .single()

  if (promoCode) {
    await supabase.from('promo_code_uses').insert({ code_id: promoCode.id, user_id: userId })
  }

  // Send SMS med login info
  if (sendSMSNotification && profile.phone) {
    const smsMessage = `Hej! Din profil på RedLightAD er klar.\n\nLog ind på: redlightad.com/login\nBrugernavn: ${email}\nKode: ${password}\n\n30 dages gratis adgang med kode: GRATIS30`
    await sendSMS({ to: profile.phone, message: smsMessage, sender: 'REDLIGHTAD' })
  }

  return Response.json({
    success: true,
    userId,
    loginId,
    email,
    password,
    phone: profile.phone,
    smsStatus: sendSMSNotification ? 'sent' : 'skipped',
  })
}
