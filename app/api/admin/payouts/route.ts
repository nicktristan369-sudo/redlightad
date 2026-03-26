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
      .from("payout_requests")
      .select(`
        *,
        payout_details:payout_details!payout_requests_user_id_fkey(
          full_name, bank_name, account_number, reg_number, iban, country, is_verified
        )
      `)
      .order("requested_at", { ascending: false })

    if (error) {
      // Fallback: query without join
      const { data: fallback, error: fallbackErr } = await supabase
        .from("payout_requests")
        .select("*")
        .order("requested_at", { ascending: false })

      if (fallbackErr) return NextResponse.json({ error: fallbackErr.message }, { status: 500 })

      // Manually join payout_details
      const userIds = [...new Set((fallback || []).map((r: { user_id: string }) => r.user_id))]
      const { data: details } = await supabase
        .from("payout_details")
        .select("user_id, full_name, bank_name, account_number, reg_number, iban, country, is_verified")
        .in("user_id", userIds)

      const detailsMap = new Map((details || []).map((d: { user_id: string }) => [d.user_id, d]))

      const enriched = (fallback || []).map((r: { user_id: string }) => ({
        ...r,
        payout_details: detailsMap.get(r.user_id) || null,
      }))

      return NextResponse.json(enriched)
    }

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
    const { request_id, action, admin_note } = body

    if (!request_id || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }

    const supabase = db()

    const status = action === "approve" ? "approved" : "rejected"
    const { error } = await supabase
      .from("payout_requests")
      .update({
        status,
        processed_at: new Date().toISOString(),
        admin_note: admin_note || null,
      })
      .eq("id", request_id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Send email notification to user if approved and Resend is configured
    if (action === "approve" && process.env.RESEND_API_KEY) {
      try {
        const { data: pr } = await supabase
          .from("payout_requests")
          .select("user_id, amount_redcoins, amount_dkk")
          .eq("id", request_id)
          .single()

        if (pr) {
          const { data: userData } = await supabase.auth.admin.getUserById(pr.user_id)
          const userEmail = userData?.user?.email
          if (userEmail) {
            await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
              },
              body: JSON.stringify({
                from: "RedLightAd <noreply@redlightad.com>",
                to: userEmail,
                subject: `Payout Approved — ${pr.amount_dkk} DKK`,
                text: [
                  `Your payout request has been approved!`,
                  ``,
                  `Amount: ${pr.amount_redcoins} RedCoins (${pr.amount_dkk} DKK)`,
                  ``,
                  `The funds will be transferred to your registered bank account within 1-3 business days.`,
                ].join("\n"),
              }),
            })
          }
        }
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
