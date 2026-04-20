import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabaseServer"

export async function POST(req: NextRequest) {
  try {
    const { phone_id, chat_id, message } = await req.json()

    if (!phone_id || !chat_id || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = createServerClient()

    // Get phone with bot token
    const { data: phone } = await supabase
      .from("agency_phones")
      .select("telegram_bot_token")
      .eq("id", phone_id)
      .single()

    if (!phone?.telegram_bot_token) {
      return NextResponse.json({ error: "No Telegram bot token configured" }, { status: 400 })
    }

    // Send message via Telegram API
    const response = await fetch(`https://api.telegram.org/bot${phone.telegram_bot_token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chat_id,
        text: message,
      }),
    })

    const result = await response.json()
    
    if (result.ok) {
      // Update message status in database
      await supabase
        .from("agency_messages")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("to_number", `telegram:${chat_id}`)
        .eq("content", message)
        .eq("status", "pending")
      
      return NextResponse.json({ success: true, message_id: result.result.message_id })
    } else {
      console.error("[TELEGRAM] Send failed:", result)
      return NextResponse.json({ error: result.description }, { status: 500 })
    }
  } catch (error) {
    console.error("[TELEGRAM] Send error:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
