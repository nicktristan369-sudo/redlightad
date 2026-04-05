import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabaseServer"
import { PREMIUM_PACKAGES, BOOST_PACKAGES } from "@/lib/spendPackages"

export async function POST(req: NextRequest) {
  try {
    const { packageId, listingId, userId } = await req.json()
    if (!packageId || !listingId || !userId) {
      return NextResponse.json({ error: "Manglende parametre" }, { status: 400 })
    }

    // Find pakke — tjek både premium og boost
    const premiumPkg = PREMIUM_PACKAGES.find(p => p.id === packageId)
    const boostPkg = BOOST_PACKAGES.find(p => p.id === packageId)
    const pkg = premiumPkg || boostPkg
    if (!pkg) return NextResponse.json({ error: "Ugyldig pakke" }, { status: 400 })

    const supabase = createServerClient()

    // Træk coins fra wallet via database function
    const { data: success, error: deductError } = await supabase.rpc("deduct_red_coins", {
      p_user_id: userId,
      p_coins: pkg.coins,
    })
    if (deductError || !success) {
      return NextResponse.json({ error: "Ikke nok Red Coins" }, { status: 402 })
    }

    const now = new Date()
    let expiresAt: Date
    let updateData: Record<string, unknown> = {}

    if (premiumPkg) {
      // Premium: sæt premium_tier og premium_until
      expiresAt = new Date(now)
      expiresAt.setMonth(expiresAt.getMonth() + premiumPkg.months)
      updateData = {
        premium_tier: "vip",
        premium_until: expiresAt.toISOString(),
      }
    } else if (boostPkg) {
      // Push to Top: sæt boost_expires_at
      expiresAt = new Date(now.getTime() + boostPkg.hours * 60 * 60 * 1000)
      updateData = {
        boost_expires_at: expiresAt.toISOString(),
        boost_purchased_at: now.toISOString(),
      }
    } else {
      return NextResponse.json({ error: "Ugyldig pakke type" }, { status: 400 })
    }

    // Opdater listing
    const { error: updateError } = await supabase
      .from("listings")
      .update(updateData)
      .eq("id", listingId)
      .eq("user_id", userId)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Log købet
    await supabase.from("boost_purchases").insert({
      user_id: userId,
      listing_id: listingId,
      package_id: packageId,
      coins_spent: pkg.coins,
      boost_type: premiumPkg ? "premium" : "push_to_top",
      expires_at: expiresAt!.toISOString(),
    })

    return NextResponse.json({ ok: true, expires_at: expiresAt!.toISOString() })
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Fejl" }, { status: 500 })
  }
}
