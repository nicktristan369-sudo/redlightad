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

    // Fetch submissions with listing title
    const { data, error } = await supabase
      .from("kyc_submissions")
      .select("*, listings(title)")
      .order("submitted_at", { ascending: false })

    if (error) {
      // Fallback without join
      const { data: fallback, error: fbErr } = await supabase
        .from("kyc_submissions")
        .select("*")
        .order("submitted_at", { ascending: false })

      if (fbErr) return NextResponse.json({ error: fbErr.message }, { status: 500 })
      return NextResponse.json(fallback)
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
    const { submission_id, action, rejection_reason } = body

    if (!submission_id || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }

    const supabase = db()

    // Get submission
    const { data: submission, error: fetchErr } = await supabase
      .from("kyc_submissions")
      .select("*")
      .eq("id", submission_id)
      .single()

    if (fetchErr || !submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 })
    }

    // Update submission
    const status = action === "approve" ? "approved" : "rejected"
    const { error: updateErr } = await supabase
      .from("kyc_submissions")
      .update({
        status,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
        rejection_reason: action === "reject" ? (rejection_reason || null) : null,
      })
      .eq("id", submission_id)

    if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

    // Update listing kyc_status
    const kycStatus = action === "approve" ? "verified" : "unverified"
    await supabase
      .from("listings")
      .update({ kyc_status: kycStatus })
      .eq("id", submission.listing_id)

    // Send email to user
    if (process.env.RESEND_API_KEY) {
      try {
        const { data: userData } = await supabase.auth.admin.getUserById(submission.user_id)
        const userEmail = userData?.user?.email
        if (userEmail) {
          const subject = action === "approve"
            ? "Your RedLightAD account has been verified ✓"
            : "Your verification was not approved"
          const text = action === "approve"
            ? "Congratulations! Your identity has been verified. You now have access to payouts and content sales."
            : `Your verification was not approved: ${rejection_reason || "No reason provided"}\n\nYou can resubmit your verification from your dashboard.`

          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            },
            body: JSON.stringify({
              from: "RedLightAd <noreply@redlightad.com>",
              to: userEmail,
              subject,
              text,
            }),
          })
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
