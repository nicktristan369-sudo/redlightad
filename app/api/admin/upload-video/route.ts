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
    const formData = await req.formData()
    const file = formData.get("file") as File | null
    if (!file) return NextResponse.json({ error: "Ingen fil" }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())

    const url = await new Promise<string>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { resource_type: "video", folder: "redlightad/videos" },
        (err, result) => {
          if (err || !result) reject(new Error(err?.message || "Upload fejlede"))
          else resolve(result.secure_url)
        }
      ).end(buffer)
    })

    return NextResponse.json({ url })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Fejl" }, { status: 500 })
  }
}
