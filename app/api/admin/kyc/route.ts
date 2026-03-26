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
      .from("kyc_submissions")
      .select("*, listings(title)")
      .order("submitted_at", { ascending: false })

    if (error) {
      const { data: fallback, error: fbErr } = await supabase
        .from("kyc_submissions")
        .select("*")
        .order("submitted_at", { ascending: false })
      if (fbErr) return NextResponse.json({ error: fbErr.message }, { status: 500 })
      return NextResponse.json(fallback)
    }
    return NextResponse.json(data)
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json()
    const { submission_id, action, rejection_reason } = body

    if (!submission_id || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }

    const supabase = db()

    const { data: submission, error: fetchErr } = await supabase
      .from("kyc_submissions")
      .select("*")
      .eq("id", submission_id)
      .single()

    if (fetchErr || !submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 })
    }

    const status = action === "approve" ? "approved" : "rejected"
    await supabase.from("kyc_submissions").update({
      status,
      reviewed_at: new Date().toISOString(),
      rejection_reason: action === "reject" ? (rejection_reason || null) : null,
    }).eq("id", submission_id)

    await supabase.from("listings").update({
      kyc_status: action === "approve" ? "verified" : "unverified",
    }).eq("id", submission.listing_id)

    if (process.env.RESEND_API_KEY) {
      try {
        const { data: userData } = await supabase.auth.admin.getUserById(submission.user_id)
        const userEmail = userData?.user?.email
        if (userEmail) {
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
            body: JSON.stringify({
              from: "RedLightAD <noreply@redlightad.com>",
              to: userEmail,
              subject: action === "approve" ? "Your RedLightAD account has been verified ✓" : "Your verification was not approved",
              text: action === "approve"
                ? "Congratulations! Your identity has been verified. You now have access to payouts and content sales."
                : `Your verification was not approved: ${rejection_reason || "No reason provided"}\n\nYou can resubmit from your dashboard.`,
            }),
          })
        }
      } catch { /* email failed silently */ }
    }

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 })
  }
}
