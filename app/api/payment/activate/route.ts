import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabaseServer"

/**
 * Activate a user's plan after successful Stripe payment
 * Called from dashboard when plan_activated=true query param is present
 * This ensures the plan is activated even if webhook is delayed
 */
export async function POST(req: NextRequest) {
  try {
    const { plan, months, userId } = await req.json()

    if (!plan || !months) {
      return NextResponse.json({ error: "Missing plan or months" }, { status: 400 })
    }

    const supabase = createServerClient()

    // Get current user if userId not provided
    let targetUserId = userId
    if (!targetUserId) {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
      }
      targetUserId = user.id
    }

    // Find user's listing
    const { data: listing, error: listingError } = await supabase
      .from("listings")
      .select("id, premium_tier, premium_until")
      .eq("user_id", targetUserId)
      .limit(1)
      .single()

    if (listingError || !listing) {
      return NextResponse.json({ error: "No listing found" }, { status: 404 })
    }

    // Check if already activated (avoid double activation)
    if (listing.premium_tier === plan) {
      return NextResponse.json({ 
        success: true, 
        message: "Already activated",
        listingId: listing.id 
      })
    }

    // Calculate premium_until
    const premiumUntil = new Date()
    premiumUntil.setMonth(premiumUntil.getMonth() + parseInt(months))

    // Map plan to premium_tier value
    const tierMap: Record<string, string> = {
      standard: "basic",
      premium: "featured",
    }
    const premiumTier = tierMap[plan] || plan

    // Activate the plan
    const { error: updateError } = await supabase
      .from("listings")
      .update({
        premium_tier: premiumTier,
        premium_until: premiumUntil.toISOString(),
        status: "active",
      })
      .eq("id", listing.id)

    if (updateError) {
      console.error("Failed to activate plan:", updateError)
      return NextResponse.json({ error: "Failed to activate plan" }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      listingId: listing.id,
      plan: premiumTier,
      premiumUntil: premiumUntil.toISOString()
    })
  } catch (e) {
    console.error("Activate plan error:", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
