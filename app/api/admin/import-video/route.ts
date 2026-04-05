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

  // Try 1: Direct download with headers
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Referer": new URL(url).origin + "/",
        "Accept": "video/mp4,video/*,*/*",
        "Accept-Language": "en-US,en;q=0.9",
      }
    })
    if (res.ok) {
      contentType = res.headers.get("content-type") || "video/mp4"
      buffer = Buffer.from(await res.arrayBuffer())
    }
  } catch { /* fallthrough */ }

  // Try 2: Via FlareSolverr (handles cookies/Cloudflare)
  if (!buffer) {
    const flareSolverrUrl = process.env.FLARESOLVERR_URL
    if (flareSolverrUrl) {
      try {
        const fsRes = await fetch(`${flareSolverrUrl}/v1`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cmd: "request.get", url, maxTimeout: 60000 }),
        })
        if (fsRes.ok) {
          const fsData = await fsRes.json()
          // FlareSolverr returns response as base64 for binary
          const responseBody = fsData?.solution?.response
          if (responseBody) {
            // Try to parse as base64
            try {
              buffer = Buffer.from(responseBody, "base64")
            } catch {
              buffer = Buffer.from(responseBody)
            }
          }
        }
      } catch { /* fallthrough */ }
    }
  }

  if (!buffer || buffer.length < 1000) {
    return NextResponse.json({ error: "Kunne ikke downloade video — CDN blokerer. Prøv at downloade manuelt og upload." }, { status: 422 })
  }

  const path = storagePath

  const { error } = await supabase.storage
    .from("media")
    .upload(path, buffer!, { contentType, upsert: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: { publicUrl } } = supabase.storage.from("media").getPublicUrl(path)

  return NextResponse.json({ url: publicUrl, path })
}
