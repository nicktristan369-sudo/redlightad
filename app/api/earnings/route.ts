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

function getNextPayoutDate(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const day = now.getDate()

  if (day < 1) return new Date(year, month, 1).toISOString().split("T")[0]
  if (day < 14) return new Date(year, month, 14).toISOString().split("T")[0]
  return new Date(year, month + 1, 1).toISOString().split("T")[0]
}

export async function GET() {
  try {
    const authClient = await getAuthClient()
    const { data: { user } } = await authClient.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const supabase = db()

    // Get user's listing
    const { data: listing } = await supabase
      .from("listings")
      .select("id")
      .eq("user_id", user.id)
      .limit(1)
      .single()

    if (!listing) {
      return NextResponse.json({
        total_earned: 0,
        available_for_payout: 0,
        next_payout_date: getNextPayoutDate(),
        bookings_count: 0,
        marketplace_count: 0,
      })
    }

    // Sum completed bookings
    const { data: bookingsData } = await supabase
      .from("bookings")
      .select("seller_receives")
      .eq("listing_id", listing.id)
      .eq("status", "completed")

    const bookingsTotal = bookingsData?.reduce((sum, b) => sum + b.seller_receives, 0) ?? 0
    const bookingsCount = bookingsData?.length ?? 0

    // Sum marketplace purchases
    const { data: marketplaceData } = await supabase
      .from("marketplace_purchases")
      .select("seller_receives")
      .eq("seller_listing_id", listing.id)

    const marketplaceTotal = marketplaceData?.reduce((sum, p) => sum + p.seller_receives, 0) ?? 0
    const marketplaceCount = marketplaceData?.length ?? 0

    const totalEarned = bookingsTotal + marketplaceTotal

    // Get already paid out
    const { data: payoutsData } = await supabase
      .from("payouts")
      .select("amount_redcoins")
      .eq("listing_id", listing.id)
      .in("status", ["pending", "paid"])

    const totalPaidOut = payoutsData?.reduce((sum, p) => sum + p.amount_redcoins, 0) ?? 0

    return NextResponse.json({
      total_earned: totalEarned,
      available_for_payout: totalEarned - totalPaidOut,
      next_payout_date: getNextPayoutDate(),
      bookings_count: bookingsCount,
      marketplace_count: marketplaceCount,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
