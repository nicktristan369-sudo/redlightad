import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabaseServer"

// POST - Phone sends heartbeat
export async function POST(req: NextRequest) {
  const supabase = createServerClient()
  
  try {
    const body = await req.json()
    const { phone_id, device_id, battery_level, signal_strength, is_online } = body

    if (!phone_id) {
      return NextResponse.json({ error: "phone_id required" }, { status: 400 })
    }

    const updateData: any = {
      is_online: is_online !== false,
      last_seen_at: new Date().toISOString(),
    }

    if (device_id) updateData.device_id = device_id
    if (battery_level !== undefined) updateData.battery_level = battery_level

    const { error } = await supabase
      .from("agency_phones")
      .update(updateData)
      .eq("id", phone_id)

    if (error) {
      return NextResponse.json({ error: "Failed to update phone" }, { status: 500 })
    }

    // Get phone settings to return to app
    const { data: phone } = await supabase
      .from("agency_phones")
      .select("ai_enabled, ai_response_delay_min, ai_response_delay_max")
      .eq("id", phone_id)
      .single()

    return NextResponse.json({
      ok: true,
      settings: phone || {},
    })

  } catch (error) {
    console.error("Heartbeat error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Mark phone as offline when app closes
export async function DELETE(req: NextRequest) {
  const supabase = createServerClient()
  const { searchParams } = new URL(req.url)
  const phoneId = searchParams.get("phone_id")

  if (!phoneId) {
    return NextResponse.json({ error: "phone_id required" }, { status: 400 })
  }

  await supabase
    .from("agency_phones")
    .update({ is_online: false })
    .eq("id", phoneId)

  return NextResponse.json({ ok: true })
}
