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

export async function POST() {
  try {
    const authClient = await getAuthClient()
    const { data: { user } } = await authClient.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const supabase = db()

    // Check payout day
    const today = new Date()
    const day = today.getDate()
    if (day !== 1 && day !== 14) {
      return NextResponse.json({ error: "Payouts are only available on the 1st and 14th" }, { status: 400 })
    }

    // Get payout details
    const { data: pd } = await supabase
      .from("payout_details")
      .select("*")
      .eq("user_id", user.id)
      .limit(1)
      .single()

    if (!pd) {
      return NextResponse.json({ error: "No payout details found. Please add your bank information first." }, { status: 400 })
    }

    if (!pd.is_verified) {
      return NextResponse.json({ error: "Identity verification required before requesting payouts" }, { status: 400 })
    }

    // Get listing
    const { data: listing } = await supabase
      .from("listings")
      .select("id")
      .eq("user_id", user.id)
      .limit(1)
      .single()

    if (!listing) {
      return NextResponse.json({ error: "No listing found" }, { status: 400 })
    }

    // Calculate available balance (same logic as earnings route)
    const { data: bookingsData } = await supabase
      .from("bookings")
      .select("seller_receives")
      .eq("listing_id", listing.id)
      .eq("status", "completed")

    const bookingsTotal = bookingsData?.reduce((sum, b) => sum + b.seller_receives, 0) ?? 0

    const { data: marketplaceData } = await supabase
      .from("marketplace_purchases")
      .select("seller_receives")
      .eq("seller_listing_id", listing.id)

    const marketplaceTotal = marketplaceData?.reduce((sum, p) => sum + p.seller_receives, 0) ?? 0

    const totalEarned = bookingsTotal + marketplaceTotal

    const { data: payoutsData } = await supabase
      .from("payouts")
      .select("amount_redcoins")
      .eq("listing_id", listing.id)
      .in("status", ["pending", "paid"])

    const totalPaidOut = payoutsData?.reduce((sum, p) => sum + p.amount_redcoins, 0) ?? 0

    // Also subtract pending payout requests
    const { data: pendingRequests } = await supabase
      .from("payout_requests")
      .select("amount_redcoins")
      .eq("user_id", user.id)
      .eq("status", "pending")

    const pendingTotal = pendingRequests?.reduce((sum, p) => sum + p.amount_redcoins, 0) ?? 0

    const available = totalEarned - totalPaidOut - pendingTotal

    if (available < 500) {
      return NextResponse.json({ error: "Minimum payout is 500 RedCoins" }, { status: 400 })
    }

    const amountDkk = available / 10

    // Insert payout request
    const { error: insertError } = await supabase
      .from("payout_requests")
      .insert({
        user_id: user.id,
        listing_id: listing.id,
        amount_redcoins: available,
        amount_dkk: amountDkk,
        status: "pending",
      })

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // Send admin notification email via Resend
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
            subject: `New Payout Request — ${pd.full_name} — ${amountDkk.toFixed(2)} DKK`,
            text: [
              `New payout request received:`,
              ``,
              `Name: ${pd.full_name}`,
              `Amount: ${available} RedCoins (${amountDkk.toFixed(2)} DKK)`,
              `Bank: ${pd.bank_name || "N/A"}`,
              `Account: ${pd.account_number}`,
              `IBAN: ${pd.iban || "N/A"}`,
              `Country: ${pd.country}`,
              ``,
              `Log in to admin panel to approve or reject.`,
            ].join("\n"),
          }),
        })
      } catch {
        // Email failed silently — don't block the request
      }
    }

    return NextResponse.json({ ok: true, amount_redcoins: available, amount_dkk: amountDkk })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
