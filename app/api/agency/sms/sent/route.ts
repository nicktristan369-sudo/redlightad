import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabaseServer"

// POST - Confirm message was sent
export async function POST(req: NextRequest) {
  const supabase = createServerClient()
  
  try {
    const body = await req.json()
    const { message_id, status, error_message } = body

    if (!message_id) {
      return NextResponse.json({ error: "message_id required" }, { status: 400 })
    }

    const updateData: any = {
      status: status || "sent",
      sent_at: new Date().toISOString(),
    }

    if (status === "failed" && error_message) {
      updateData.status = "failed"
      // Could log error somewhere
    }

    const { error } = await supabase
      .from("agency_messages")
      .update(updateData)
      .eq("id", message_id)

    if (error) {
      return NextResponse.json({ error: "Failed to update message" }, { status: 500 })
    }

    return NextResponse.json({ ok: true })

  } catch (error) {
    console.error("Sent confirmation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
