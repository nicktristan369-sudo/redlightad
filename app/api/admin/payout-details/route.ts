import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"

async function getAuthClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  )
}

const db = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

const ADMIN_EMAILS = ["admin@redlightad.com", "tristan@redlightad.com"]

export async function GET() {
  try {
    const authClient = await getAuthClient()
    const { data: { user } } = await authClient.auth.getUser()
    if (!user || !ADMIN_EMAILS.includes(user.email || "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const supabase = db()
    const { data, error } = await supabase
      .from("payout_details")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json(data)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const authClient = await getAuthClient()
    const { data: { user } } = await authClient.auth.getUser()
    if (!user || !ADMIN_EMAILS.includes(user.email || "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await req.json()
    const { payout_detail_id } = body

    if (!payout_detail_id) {
      return NextResponse.json({ error: "Missing payout_detail_id" }, { status: 400 })
    }

    const supabase = db()
    const { error } = await supabase
      .from("payout_details")
      .update({
        is_verified: true,
        id_verified: true,
        verified_at: new Date().toISOString(),
      })
      .eq("id", payout_detail_id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
