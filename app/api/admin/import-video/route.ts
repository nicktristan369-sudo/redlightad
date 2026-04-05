import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const { url, listingId } = await req.json()
  if (!url) return NextResponse.json({ error: "No URL" }, { status: 400 })

  const ext = url.split(".").pop()?.split("?")[0] || "mp4"
  const filename = `import_${Date.now()}.${ext}`
  const storagePath = listingId ? `listings/${listingId}/${filename}` : `imports/${filename}`

  let buffer: Buffer | null = null
  let contentType = "video/mp4"

  // Download via VPS proxy (bypasser CDN hotlink protection)
  const vpsProxy = process.env.VPS_VIDPROXY_URL || "http://76.13.154.9:3001"
  const referer = url.includes("eurogirlsescort") ? "https://www.eurogirlsescort.com/" : new URL(url).origin + "/"
  const proxyUrl = `${vpsProxy}/download?url=${encodeURIComponent(url)}&referer=${encodeURIComponent(referer)}`

  try {
    const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(120000) })
    if (res.ok) {
      contentType = res.headers.get("content-type") || "video/mp4"
      buffer = Buffer.from(await res.arrayBuffer())
    } else {
      const err = await res.text()
      return NextResponse.json({ error: `VPS proxy fejlede: ${err}` }, { status: 422 })
    }
  } catch (e: unknown) {
    return NextResponse.json({ error: `VPS proxy fejlede: ${e instanceof Error ? e.message : "timeout"}` }, { status: 422 })
  }

  if (!buffer || buffer.length < 1000) {
    return NextResponse.json({ error: "Video for lille eller tom — CDN blokerer stadig." }, { status: 422 })
  }

  const path = storagePath

  const { error } = await supabase.storage
    .from("media")
    .upload(path, buffer!, { contentType, upsert: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: { publicUrl } } = supabase.storage.from("media").getPublicUrl(path)

  return NextResponse.json({ url: publicUrl, path })
}
