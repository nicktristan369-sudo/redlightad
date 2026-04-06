import { NextRequest, NextResponse } from "next/server"
import { v2 as cloudinary } from "cloudinary"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export const maxDuration = 300

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()
    if (!url) return NextResponse.json({ error: "No URL" }, { status: 400 })

    const vpsProxy = process.env.VPS_VIDPROXY_URL || "http://76.13.154.9:3001"

    // Trin 1: Puppeteer på VPS — rigtig browser downloader videoen
    let cloudinaryUrl: string | null = null
    const profileUrl = url.includes("eurogirlsescort") ? url : url
    const puppeteerRes = await fetch(`${vpsProxy}/fetch-video?url=${encodeURIComponent(url)}&profile=${encodeURIComponent(profileUrl)}`)
    if (puppeteerRes.ok) {
      const buffer = Buffer.from(await puppeteerRes.arrayBuffer())
      if (buffer.length >= 10000) {
        cloudinaryUrl = await new Promise<string>((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            { resource_type: "video", folder: "redlightad/videos" },
            (err, result) => {
              if (err || !result) reject(new Error(err?.message || "Upload fejlede"))
              else resolve(result.secure_url)
            }
          ).end(buffer)
        })
      }
    }

    if (!cloudinaryUrl) {
      const errText = puppeteerRes.ok ? "Video for lille" : await puppeteerRes.text()
      return NextResponse.json({ error: `Kunne ikke hente video: ${errText}. Download manuelt og upload.` }, { status: 422 })
    }

    // Trin 3: FFmpeg vandmærke-fjernelse via VPS
    const dewatermarkRes = await fetch(`${vpsProxy}/dewatermark?url=${encodeURIComponent(cloudinaryUrl)}`)
    if (!dewatermarkRes.ok) {
      // Cloudinary upload OK, men dewatermark fejlede — returner ren Cloudinary URL
      return NextResponse.json({ url: cloudinaryUrl, warning: "Video uploadet men vandmærke ikke fjernet" })
    }

    const dewatermarkedBuffer = Buffer.from(await dewatermarkRes.arrayBuffer())
    if (dewatermarkedBuffer.length < 10000) {
      return NextResponse.json({ url: cloudinaryUrl, warning: "Vandmærke-fjernelse fejlede — originalen bevaret" })
    }

    // Trin 4: Upload den rene video til Cloudinary
    const finalUrl = await new Promise<string>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { resource_type: "video", folder: "redlightad/videos" },
        (err, result) => {
          if (err || !result) reject(new Error(err?.message || "Final upload fejlede"))
          else resolve(result.secure_url)
        }
      ).end(dewatermarkedBuffer)
    })

    return NextResponse.json({ url: finalUrl })
  } catch (e: unknown) {
    console.error("import-and-dewatermark error:", e)
    return NextResponse.json({ error: e instanceof Error ? e.message : "Ukendt fejl" }, { status: 500 })
  }
}
