import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabaseServer"

// GET - Fetch pending outbound messages for a phone
export async function GET(req: NextRequest) {
  const supabase = createServerClient()
  const { searchParams } = new URL(req.url)
  const phoneId = searchParams.get("phone_id")

  if (!phoneId) {
    return NextResponse.json({ error: "phone_id required" }, { status: 400 })
  }

  // Get messages that are scheduled and ready to send
  const now = new Date().toISOString()

  const { data: messages, error } = await supabase
    .from("agency_messages")
    .select(`
      id, content, scheduled_send_at,
      agency_conversations!inner(customer_phone)
    `)
    .eq("phone_id", phoneId)
    .eq("direction", "outbound")
    .eq("status", "pending")
    .lte("scheduled_send_at", now)
    .order("scheduled_send_at", { ascending: true })
    .limit(10)

  if (error) {
    console.error("Outbound fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
  }

  // Transform to simpler format
  const pending = (messages || []).map((m: any) => ({
    id: m.id,
    to_number: m.agency_conversations.customer_phone,
    message: m.content,
  }))

  return NextResponse.json({ messages: pending })
}
