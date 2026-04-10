export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const getAdmin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST /api/admin/verify-phone — manually mark a phone as verified
export async function POST(req: NextRequest) {
  // Check admin auth
  const authHeader = req.headers.get("authorization") || ""
  const token = authHeader.replace("Bearer ", "")
  const { data: { user }, error: authError } = await getAdmin().auth.getUser(token)
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: profile } = await getAdmin()
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { phone, listing_id } = await req.json()
  if (!phone) return NextResponse.json({ error: "phone required" }, { status: 400 })

  const supabase = getAdmin()

  // Mark phone as verified in listings
  if (listing_id) {
    await supabase
      .from("listings")
      .update({ phone_verified: true, phone })
      .eq("id", listing_id)
  }

  // Also mark verified in customer_profiles if exists
  await supabase
    .from("customer_profiles")
    .update({ phone_verified: true })
    .eq("phone", phone)

  // Insert a used/verified code so the system recognizes the phone
  await supabase.from("phone_verification_codes").insert({
    phone,
    code: "000000",
    expires_at: new Date(Date.now() + 999999999).toISOString(),
    used: true,
  })

  return NextResponse.json({ ok: true, phone })
}
