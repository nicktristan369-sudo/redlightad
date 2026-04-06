import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"

export async function POST(req: NextRequest) {
  try {
    const { folder = "redlightad/videos", resource_type = "video" } = await req.json().catch(() => ({}))

    const apiSecret = process.env.CLOUDINARY_API_SECRET
    const apiKey = process.env.CLOUDINARY_API_KEY
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME

    if (!apiSecret || !apiKey || !cloudName) {
      return NextResponse.json({ error: "Cloudinary not configured" }, { status: 500 })
    }

    const timestamp = Math.round(Date.now() / 1000)
    const paramsToSign = `folder=${folder}&timestamp=${timestamp}`
    const signature = crypto
      .createHash("sha256")
      .update(paramsToSign + apiSecret)
      .digest("hex")

    return NextResponse.json({ signature, timestamp, apiKey, cloudName, folder, resource_type })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Error" }, { status: 500 })
  }
}
