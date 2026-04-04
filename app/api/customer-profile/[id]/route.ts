import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"

const admin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Verificer at requester er i en samtale med denne kunde (adgangskontrol)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: customerId } = await params

  const authHeader = req.headers.get("authorization") ?? ""
  const token = authHeader.replace("Bearer ", "").trim()
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: { user }, error: authErr } = await admin().auth.getUser(token)
  if (authErr || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Tjek at requester er i en samtale med customerId
  const { data: conv } = await admin()
    .from("conversations")
    .select("id")
    .or(`provider_id.eq.${user.id},customer_id.eq.${user.id}`)
    .or(`customer_id.eq.${customerId},provider_id.eq.${customerId}`)
    .limit(1)
    .maybeSingle()

  if (!conv) return NextResponse.json({ error: "Ingen adgang" }, { status: 403 })

  const { data: profile } = await admin()
    .from("customer_profiles")
    .select("*")
    .eq("user_id", customerId)
    .single()

  if (!profile) return NextResponse.json({ user_id: customerId, username: null, avatar_url: null })
  return NextResponse.json(profile)
}
