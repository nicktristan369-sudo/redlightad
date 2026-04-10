import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const getAdmin = () => createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// GET /api/cam/recordings?listingId=xxx  — public (for viewer cam page)
// GET /api/cam/recordings?mine=1          — authenticated (for dashboard)
export async function GET(req: NextRequest) {
  const listingId = req.nextUrl.searchParams.get("listingId")
  const mine = req.nextUrl.searchParams.get("mine")

  if (mine) {
    const token = (req.headers.get("authorization") ?? "").replace("Bearer ", "").trim()
    const { data: { user } } = await getAdmin().auth.getUser(token)
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data } = await getAdmin()
      .from("cam_recordings")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    return NextResponse.json({ recordings: data || [] })
  }

  if (listingId) {
    const { data } = await getAdmin()
      .from("cam_recordings")
      .select("id, title, cloudinary_url, thumbnail_url, duration_seconds, tip_total, created_at")
      .eq("listing_id", listingId)
      .eq("visible", true)
      .order("created_at", { ascending: false })
      .limit(10)

    return NextResponse.json({ recordings: data || [] })
  }

  return NextResponse.json({ error: "Missing params" }, { status: 400 })
}

// POST /api/cam/recordings — save a new recording after stream ends
export async function POST(req: NextRequest) {
  const token = (req.headers.get("authorization") ?? "").replace("Bearer ", "").trim()
  const { data: { user } } = await getAdmin().auth.getUser(token)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { listingId, cloudinaryUrl, cloudinaryPublicId, durationSeconds, fileSizeBytes, title } = await req.json()
  if (!listingId || !cloudinaryUrl) return NextResponse.json({ error: "Missing fields" }, { status: 400 })

  // Verify ownership
  const { data: listing } = await getAdmin().from("listings").select("user_id, display_name").eq("id", listingId).single()
  if (!listing || listing.user_id !== user.id) return NextResponse.json({ error: "Not your listing" }, { status: 403 })

  const { data, error } = await getAdmin().from("cam_recordings").insert({
    listing_id: listingId,
    user_id: user.id,
    title: title || `${listing.display_name} — Live Stream`,
    cloudinary_url: cloudinaryUrl,
    cloudinary_public_id: cloudinaryPublicId,
    duration_seconds: durationSeconds || 0,
    file_size_bytes: fileSizeBytes || 0,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ recording: data })
}

// DELETE /api/cam/recordings?id=xxx
export async function DELETE(req: NextRequest) {
  const token = (req.headers.get("authorization") ?? "").replace("Bearer ", "").trim()
  const { data: { user } } = await getAdmin().auth.getUser(token)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const id = req.nextUrl.searchParams.get("id")
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  // Verify ownership
  const { data: rec } = await getAdmin().from("cam_recordings").select("user_id, cloudinary_public_id").eq("id", id).single()
  if (!rec || rec.user_id !== user.id) return NextResponse.json({ error: "Not found or not yours" }, { status: 404 })

  // Delete from Cloudinary
  if (rec.cloudinary_public_id) {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "drxpitjyw"
    const apiKey = process.env.CLOUDINARY_API_KEY
    const apiSecret = process.env.CLOUDINARY_API_SECRET
    if (apiKey && apiSecret) {
      const timestamp = Math.round(Date.now() / 1000)
      const sig = require("crypto").createHash("sha1")
        .update(`public_id=${rec.cloudinary_public_id}&timestamp=${timestamp}${apiSecret}`)
        .digest("hex")
      await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/video/destroy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ public_id: rec.cloudinary_public_id, api_key: apiKey, timestamp, signature: sig }),
      }).catch(() => {})
    }
  }

  await getAdmin().from("cam_recordings").delete().eq("id", id)
  return NextResponse.json({ ok: true })
}

// PATCH /api/cam/recordings — toggle visibility
export async function PATCH(req: NextRequest) {
  const token = (req.headers.get("authorization") ?? "").replace("Bearer ", "").trim()
  const { data: { user } } = await getAdmin().auth.getUser(token)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id, visible } = await req.json()
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  const { data: rec } = await getAdmin().from("cam_recordings").select("user_id").eq("id", id).single()
  if (!rec || rec.user_id !== user.id) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await getAdmin().from("cam_recordings").update({ visible }).eq("id", id)
  return NextResponse.json({ ok: true })
}
