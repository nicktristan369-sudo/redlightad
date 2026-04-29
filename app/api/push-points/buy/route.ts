import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { PUSH_POINT_PACKAGES } from "@/lib/spendPackages"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { packageId, userId } = await req.json()
    if (!packageId || !userId) return NextResponse.json({ error: "Missing params" }, { status: 400 })

    const pkg = PUSH_POINT_PACKAGES.find((p) => p.id === packageId)
    if (!pkg) return NextResponse.json({ error: "Invalid package" }, { status: 400 })

    // Get current balance
    const { data: wallet } = await supabase
      .from("wallets")
      .select("push_points")
      .eq("user_id", userId)
      .single()

    const current = wallet?.push_points ?? 0

    // Update wallet
    const { error: walletErr } = await supabase
      .from("wallets")
      .upsert({ user_id: userId, push_points: current + pkg.points }, { onConflict: "user_id" })

    if (walletErr) {
      return NextResponse.json({ error: walletErr.message }, { status: 500 })
    }

    // Log purchase
    await supabase.from("push_point_purchases").insert({
      user_id: userId,
      package_id: packageId,
      points_bought: pkg.points,
      price_usd: pkg.price_usd,
    })

    return NextResponse.json({ success: true, points_added: pkg.points })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
