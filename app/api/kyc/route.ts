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
      .from("kyc_submissions")
      .select("*")
      .eq("user_id", user.id)
      .order("submitted_at", { ascending: false })
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
    const { full_name, date_of_birth, country, id_front_url, id_back_url, selfie_url, listing_id } = body

    if (!full_name || !date_of_birth || !country || !id_front_url || !selfie_url || !listing_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validate age >= 18
    const dob = new Date(date_of_birth)
    const now = new Date()
    let age = now.getFullYear() - dob.getFullYear()
    const m = now.getMonth() - dob.getMonth()
    if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--
    if (age < 18) {
      return NextResponse.json({ error: "You must be at least 18 years old" }, { status: 400 })
    }

    const supabase = db()

    const { error: insertErr } = await supabase
      .from("kyc_submissions")
      .insert({
        user_id: user.id,
        listing_id,
        full_name,
        date_of_birth,
        country,
        id_front_url,
        id_back_url: id_back_url || null,
        selfie_url,
        status: "pending",
      })

    if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 })

    // Update listing kyc_status
    await supabase
      .from("listings")
      .update({ kyc_status: "pending" })
      .eq("id", listing_id)

    // Send admin notification email
    if (process.env.RESEND_API_KEY) {
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "RedLightAd <noreply@redlightad.com>",
            to: "admin@redlightad.com",
            subject: `New KYC submission from ${full_name}`,
            text: `New KYC submission received.\n\nName: ${full_name}\nCountry: ${country}\nDate of birth: ${date_of_birth}\nListing ID: ${listing_id}`,
          }),
        })
      } catch {
        // Email failed silently
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
