import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret")
  if (secret !== process.env.ADMIN_SESSION_SECRET?.slice(0, 16)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Get all listings without share_code
  const { data: listings } = await sb
    .from("listings")
    .select("id, share_code")

  let updated = 0
  let errors = 0

  for (const listing of listings || []) {
    if (!listing.share_code) {
      // Generate random 8-char code
      const code = Math.random().toString(36).slice(2, 6) + Math.random().toString(36).slice(2, 6)
      const { error } = await sb
        .from("listings")
        .update({ share_code: code })
        .eq("id", listing.id)
      if (error) errors++
      else updated++
    }
  }

  return NextResponse.json({ updated, errors, total: listings?.length })
}
