import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { chat_id, account_id, content, message_type = "text" } = body

  if (!chat_id || !account_id || !content) {
    return NextResponse.json(
      { error: "chat_id, account_id, and content are required" },
      { status: 400 }
    )
  }

  // Insert the message
  const { data: message, error: msgError } = await supabase
    .from("whatsapp_messages")
    .insert({
      chat_id,
      account_id,
      content,
      message_type,
      from_me: true,
      status: "sent",
      timestamp: new Date().toISOString(),
    })
    .select()
    .single()

  if (msgError) return NextResponse.json({ error: msgError.message }, { status: 500 })

  // Update chat's last message
  await supabase
    .from("whatsapp_chats")
    .update({
      last_message: content,
      last_message_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", chat_id)

  return NextResponse.json(message)
}
