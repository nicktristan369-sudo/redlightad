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
    const proxyUrl = `${vpsProxy}/dewatermark?url=${encodeURIComponent(url)}`

    // VPS downloader + FFmpeg fjerner vandmærke
    const res = await fetch(proxyUrl)
    if (!res.ok) {
      const err = await res.text()
      return NextResponse.json({ error: `VPS fejl: ${err}` }, { status: 422 })
    }

    const buffer = Buffer.from(await res.arrayBuffer())
    if (buffer.length < 10000) {
      return NextResponse.json({ error: "Behandlet video for lille" }, { status: 422 })
    }

    // Upload til Cloudinary
    const publicUrl = await new Promise<string>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { resource_type: "video", folder: "redlightad/videos" },
        (err, result) => {
          if (err || !result) reject(new Error(err?.message || "Upload fejlede"))
          else resolve(result.secure_url)
        }
      ).end(buffer)
    })

    return NextResponse.json({ url: publicUrl })
  } catch (e: unknown) {
    console.error("dewatermark-video error:", e)
    return NextResponse.json({ error: e instanceof Error ? e.message : "Ukendt fejl" }, { status: 500 })
  }
}
