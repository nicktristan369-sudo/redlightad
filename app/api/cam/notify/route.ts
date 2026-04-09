import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "") ?? ""
  const { data: { user } } = await supabaseAdmin.auth.getUser(token)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { listingId } = await req.json()
  if (!listingId) return NextResponse.json({ error: "Missing listingId" }, { status: 400 })

  // Check if already exists
  const { data: existing } = await supabaseAdmin
    .from("cam_notify")
    .select("id")
    .eq("user_id", user.id)
    .eq("listing_id", listingId)
    .maybeSingle()

  if (existing) {
    // Remove
    await supabaseAdmin.from("cam_notify").delete().eq("id", existing.id)
    return NextResponse.json({ notifying: false })
  } else {
    // Insert
    await supabaseAdmin.from("cam_notify").insert({ user_id: user.id, listing_id: listingId })
    return NextResponse.json({ notifying: true })
  }
}
