import { NextRequest, NextResponse } from "next/server"
import { v2 as cloudinary } from "cloudinary"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// Extend Vercel function timeout to 5 minutes
export const maxDuration = 300

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()
    if (!url) return NextResponse.json({ error: "No URL" }, { status: 400 })

    // Download via VPS proxy (bypasser CDN hotlink protection)
    const vpsProxy = process.env.VPS_VIDPROXY_URL || "http://76.13.154.9:3001"
    const referer = url.includes("eurogirlsescort") ? "https://www.eurogirlsescort.com/" : new URL(url).origin + "/"
    const proxyUrl = `${vpsProxy}/download?url=${encodeURIComponent(url)}&referer=${encodeURIComponent(referer)}`

    let buffer: Buffer | null = null

    try {
      const res = await fetch(proxyUrl)
      if (!res.ok) {
        const err = await res.text()
        return NextResponse.json({ error: `VPS proxy: ${err}` }, { status: 422 })
      }
      buffer = Buffer.from(await res.arrayBuffer())
    } catch (e: unknown) {
      return NextResponse.json({ error: `Download fejlede: ${e instanceof Error ? e.message : "ukendt fejl"}` }, { status: 422 })
    }

    if (!buffer || buffer.length < 1000) {
      return NextResponse.json({ error: "Video er tom eller for lille" }, { status: 422 })
    }

    // Upload til Cloudinary
    const publicUrl = await new Promise<string>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { resource_type: "video", folder: "redlightad/videos" },
        (err, result) => {
          if (err || !result) reject(new Error(err?.message || "Cloudinary upload fejlede"))
          else resolve(result.secure_url)
        }
      )
      stream.end(buffer!)
    })

    return NextResponse.json({ url: publicUrl })
  } catch (e: unknown) {
    console.error("import-video error:", e)
    return NextResponse.json({ error: e instanceof Error ? e.message : "Ukendt fejl" }, { status: 500 })
  }
}
