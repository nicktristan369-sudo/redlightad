import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const { url, listingId } = await req.json()
  if (!url) return NextResponse.json({ error: "No URL" }, { status: 400 })

  // Download video from external URL
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      "Referer": "https://www.eurogirlsescort.com/",
    }
  })

  if (!res.ok) return NextResponse.json({ error: `Download failed: ${res.status}` }, { status: 422 })

  const contentType = res.headers.get("content-type") || "video/mp4"
  const ext = url.split(".").pop()?.split("?")[0] || "mp4"
  const filename = `import_${Date.now()}.${ext}`
  const path = listingId ? `listings/${listingId}/${filename}` : `imports/${filename}`

  const buffer = Buffer.from(await res.arrayBuffer())

  const { error } = await supabase.storage
    .from("media")
    .upload(path, buffer, { contentType, upsert: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: { publicUrl } } = supabase.storage.from("media").getPublicUrl(path)

  return NextResponse.json({ url: publicUrl, path })
}
