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

export async function GET() {
  try {
    const authClient = await getAuthClient()
    const { data: { user } } = await authClient.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const supabase = db()
    const { data, error } = await supabase
      .from("payout_details")
      .select("*")
      .eq("user_id", user.id)
      .limit(1)
      .single()

    if (error && error.code !== "PGRST116") {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data || null)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const authClient = await getAuthClient()
    const { data: { user } } = await authClient.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const { full_name, bank_name, account_number, reg_number, iban, swift, country, id_document_url } = body

    if (!full_name || !account_number || !country) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = db()

    // Get user's listing
    const { data: listing } = await supabase
      .from("listings")
      .select("id")
      .eq("user_id", user.id)
      .limit(1)
      .single()

    // Check if payout details already exist
    const { data: existing } = await supabase
      .from("payout_details")
      .select("id")
      .eq("user_id", user.id)
      .limit(1)
      .single()

    const payload = {
      user_id: user.id,
      listing_id: listing?.id || null,
      full_name,
      bank_name: bank_name || null,
      account_number,
      reg_number: reg_number || null,
      iban: iban || null,
      swift: swift || null,
      country,
      id_document_url: id_document_url || null,
      updated_at: new Date().toISOString(),
    }

    if (existing) {
      const { error } = await supabase
        .from("payout_details")
        .update(payload)
        .eq("id", existing.id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    } else {
      const { error } = await supabase
        .from("payout_details")
        .insert(payload)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
