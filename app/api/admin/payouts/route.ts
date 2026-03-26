import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const db = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

export async function GET() {
  try {
    const supabase = db()
    const { data, error } = await supabase
      .from("payout_requests")
      .select("*")
      .order("requested_at", { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Enrich with payout_details
    const userIds = [...new Set((data || []).map((r: { user_id: string }) => r.user_id))]
    const { data: details } = await supabase
      .from("payout_details")
      .select("user_id, full_name, bank_name, account_number, reg_number, iban, country, is_verified")
      .in("user_id", userIds)

    const detailsMap = new Map((details || []).map((d: { user_id: string }) => [d.user_id, d]))
    const enriched = (data || []).map((r: { user_id: string }) => ({
      ...r,
      payout_details: detailsMap.get(r.user_id) || null,
    }))

    return NextResponse.json(enriched)
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const { request_id, action, admin_note } = await req.json()
    if (!request_id || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }

    const supabase = db()
    await supabase.from("payout_requests").update({
      status: action === "approve" ? "approved" : "rejected",
      processed_at: new Date().toISOString(),
      admin_note: admin_note || null,
    }).eq("id", request_id)

    if (action === "approve" && process.env.RESEND_API_KEY) {
      try {
        const { data: pr } = await supabase.from("payout_requests").select("user_id, amount_redcoins, amount_dkk").eq("id", request_id).single()
        if (pr) {
          const { data: userData } = await supabase.auth.admin.getUserById(pr.user_id)
          const userEmail = userData?.user?.email
          if (userEmail) {
            await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
              body: JSON.stringify({
                from: "RedLightAD <noreply@redlightad.com>",
                to: userEmail,
                subject: `Payout Approved — ${pr.amount_dkk} DKK`,
                text: `Your payout of ${pr.amount_redcoins} RedCoins (${pr.amount_dkk} DKK) has been approved and will be transferred within 1-3 business days.`,
              }),
            })
          }
        }
      } catch { /* email silent */ }
    }

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 })
  }
}
