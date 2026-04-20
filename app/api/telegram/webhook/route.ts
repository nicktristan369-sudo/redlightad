import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabaseServer"
import Anthropic from "@anthropic-ai/sdk"

const anthropic = new Anthropic()

// Send Telegram message with optional inline keyboard
async function sendTelegramMessageWithButtons(
  botToken: string, 
  chatId: string, 
  text: string, 
  buttons?: { text: string; url?: string; callback_data?: string }[][]
) {
  const payload: any = {
    chat_id: chatId,
    text: text,
    parse_mode: "HTML",
  }
  
  if (buttons) {
    payload.reply_markup = {
      inline_keyboard: buttons.map(row => 
        row.map(btn => btn.url 
          ? { text: btn.text, url: btn.url }
          : { text: btn.text, callback_data: btn.callback_data }
        )
      )
    }
  }
  
  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
  return response.json()
}

// POST - Receive Telegram messages and callbacks
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    console.log("[TELEGRAM] Received webhook:", JSON.stringify(body).substring(0, 500))

    // Handle callback queries (button clicks)
    if (body.callback_query) {
      return handleCallbackQuery(body.callback_query, req)
    }

    // Extract message from Telegram update
    const message = body.message
    if (!message || !message.text) {
      return NextResponse.json({ ok: true })
    }

    const chatId = message.chat.id.toString()
    const fromUser = message.from
    const text = message.text
    const username = fromUser.username || fromUser.first_name || "Unknown"

    // Get bot token from URL params
    const url = new URL(req.url)
    const phoneId = url.searchParams.get("phone_id")

    if (!phoneId) {
      console.error("[TELEGRAM] No phone_id in webhook URL")
      return NextResponse.json({ error: "Missing phone_id" }, { status: 400 })
    }

    const supabase = createServerClient()

    // Get phone settings
    const { data: phone } = await supabase
      .from("agency_phones")
      .select("*")
      .eq("id", phoneId)
      .single()

    if (!phone) {
      console.error("[TELEGRAM] Phone not found:", phoneId)
      return NextResponse.json({ error: "Phone not found" }, { status: 404 })
    }

    // Handle commands
    if (text.startsWith("/")) {
      return handleCommand(text, chatId, phone, username, phoneId)
    }

    // Find or create conversation
    let { data: conversation } = await supabase
      .from("agency_conversations")
      .select("*")
      .eq("phone_id", phoneId)
      .eq("customer_phone", `telegram:${chatId}`)
      .single()

    if (!conversation) {
      const { data: newConv } = await supabase
        .from("agency_conversations")
        .insert({
          phone_id: phoneId,
          customer_phone: `telegram:${chatId}`,
          customer_name: username,
          status: phone.ai_enabled ? "ai_handling" : "manual",
          channel: "telegram",
        })
        .select()
        .single()
      conversation = newConv
    }

    if (!conversation) {
      console.error("[TELEGRAM] Failed to create conversation")
      return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 })
    }

    // Store inbound message
    await supabase.from("agency_messages").insert({
      conversation_id: conversation.id,
      phone_id: phoneId,
      direction: "inbound",
      content: text,
      status: "received",
      channel: "telegram",
      from_number: `telegram:${chatId}`,
    })

    // Update conversation
    await supabase
      .from("agency_conversations")
      .update({
        last_message_at: new Date().toISOString(),
        message_count: (conversation.message_count || 0) + 1,
      })
      .eq("id", conversation.id)

    // Generate AI response if enabled
    if (phone.ai_enabled && conversation.status === "ai_handling") {
      // Get conversation history
      const { data: history } = await supabase
        .from("agency_messages")
        .select("direction, content")
        .eq("conversation_id", conversation.id)
        .order("created_at", { ascending: true })
        .limit(20)

      const messages = (history || []).map(m => ({
        role: m.direction === "inbound" ? "user" : "assistant",
        content: m.content,
      }))

      // Build system prompt
      const language = phone.ai_language || "da"
      const style = phone.ai_style || "flirty"
      const persona = phone.persona_name || "Assistant"
      
      const systemPrompt = `Du er ${persona}, en ${style} escort. Svar altid på ${language === "da" ? "dansk" : language}.
Vær venlig, flirtende og mystisk. Hold svarene korte (1-3 sætninger).
${phone.persona_services ? `Services: ${phone.persona_services}` : ""}
${phone.persona_rates ? `Priser: ${phone.persona_rates}` : ""}
${phone.persona_address ? `Adresse: ${phone.persona_address}` : ""}
${phone.ai_rules ? `REGLER (SKAL FØLGES): ${phone.ai_rules.join(". ")}` : ""}`

      // Generate response
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 300,
        system: systemPrompt,
        messages: messages as any,
      })

      const aiReply = (response.content[0] as any).text

      // Calculate delay
      const minDelay = phone.ai_response_delay_min || 30
      const maxDelay = phone.ai_response_delay_max || 90
      const delaySeconds = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay
      const scheduledTime = new Date(Date.now() + delaySeconds * 1000)

      // Store AI response
      await supabase.from("agency_messages").insert({
        conversation_id: conversation.id,
        phone_id: phoneId,
        direction: "outbound",
        content: aiReply,
        status: "pending",
        sent_by: "ai",
        ai_generated: true,
        channel: "telegram",
        to_number: `telegram:${chatId}`,
        scheduled_send_at: scheduledTime.toISOString(),
      })

      // Schedule sending via Telegram (or use a background worker)
      // For now, send immediately after delay
      setTimeout(async () => {
        await sendTelegramMessage(phone.telegram_bot_token, chatId, aiReply)
        
        // Update message status
        await supabase
          .from("agency_messages")
          .update({ status: "sent", sent_at: new Date().toISOString() })
          .eq("conversation_id", conversation.id)
          .eq("content", aiReply)
          .eq("status", "pending")
      }, delaySeconds * 1000)
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[TELEGRAM] Webhook error:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

async function sendTelegramMessage(botToken: string, chatId: string, text: string) {
  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
      }),
    })
    const result = await response.json()
    console.log("[TELEGRAM] Send result:", result.ok)
    return result.ok
  } catch (error) {
    console.error("[TELEGRAM] Send error:", error)
    return false
  }
}

// GET - Setup webhook for a phone
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const phoneId = url.searchParams.get("phone_id")
  const action = url.searchParams.get("action")

  if (!phoneId) {
    return NextResponse.json({ error: "phone_id required" }, { status: 400 })
  }

  const supabase = createServerClient()
  const { data: phone } = await supabase
    .from("agency_phones")
    .select("telegram_bot_token")
    .eq("id", phoneId)
    .single()

  if (!phone?.telegram_bot_token) {
    return NextResponse.json({ error: "No Telegram bot token configured" }, { status: 400 })
  }

  if (action === "setup") {
    // Set up webhook with Telegram
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://redlightad.com"}/api/telegram/webhook?phone_id=${phoneId}`
    
    const response = await fetch(
      `https://api.telegram.org/bot${phone.telegram_bot_token}/setWebhook`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: webhookUrl }),
      }
    )
    const result = await response.json()
    
    return NextResponse.json({ 
      success: result.ok, 
      webhook_url: webhookUrl,
      telegram_response: result 
    })
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 })
}

// Handle /commands
async function handleCommand(text: string, chatId: string, phone: any, username: string, phoneId: string) {
  const command = text.split(" ")[0].toLowerCase()
  const botToken = phone.telegram_bot_token
  const personaName = phone.persona_name || "Mig"
  
  // Get custom menu settings from phone
  const telegramChannel = (phone as any).telegram_channel || ""
  const snapchat = (phone as any).snapchat || ""
  const onlyfans = (phone as any).onlyfans || ""
  const instagram = (phone as any).instagram || ""
  
  if (command === "/start") {
    const welcomeText = `
✨ <b>Velkommen til ${personaName}</b> ✨

Hej ${username}! 💋

Hvad vil du gerne i dag?
`
    
    const buttons: any[][] = [
      [{ text: "💬 Chat med mig", callback_data: "chat" }],
      [{ text: "📸 Køb mine billeder", callback_data: "billeder" }],
    ]
    
    // Add social links if configured
    if (telegramChannel) {
      buttons.push([{ text: "📺 Telegram Kanal", url: telegramChannel }])
    }
    if (snapchat) {
      buttons.push([{ text: "👻 Snapchat", url: `https://snapchat.com/add/${snapchat}` }])
    }
    if (onlyfans) {
      buttons.push([{ text: "🔥 OnlyFans", url: onlyfans }])
    }
    if (instagram) {
      buttons.push([{ text: "📷 Instagram", url: `https://instagram.com/${instagram}` }])
    }
    
    await sendTelegramMessageWithButtons(botToken, chatId, welcomeText, buttons)
    return NextResponse.json({ ok: true })
  }
  
  if (command === "/chat") {
    await sendTelegramMessageWithButtons(botToken, chatId, 
      `💌 <b>Chat med ${personaName}</b>\n\nSkriv bare din besked, så svarer jeg så hurtigt jeg kan! 😘`,
      [[{ text: "⬅️ Tilbage til menu", callback_data: "menu" }]]
    )
    return NextResponse.json({ ok: true })
  }
  
  if (command === "/billeder" || command === "/pictures") {
    const pricesText = `
📸 <b>Mine billeder</b>

👙 Lingeri billeder - 50 DKK
🔥 Spicy billeder - 100 DKK  
🌟 Premium pakke (10 stk) - 400 DKK
🎉 Custom billeder - 200 DKK

💳 Betaling via MobilePay

Skriv til mig for at bestælle! 💋
`
    await sendTelegramMessageWithButtons(botToken, chatId, pricesText, [
      [{ text: "💬 Bestil nu", callback_data: "chat" }],
      [{ text: "⬅️ Tilbage til menu", callback_data: "menu" }]
    ])
    return NextResponse.json({ ok: true })
  }
  
  if (command === "/menu" || command === "/help") {
    // Same as /start
    return handleCommand("/start", chatId, phone, username, phoneId)
  }
  
  // Unknown command - treat as normal message
  return NextResponse.json({ ok: true, handled: false })
}

// Handle button callbacks
async function handleCallbackQuery(callback: any, req: NextRequest) {
  const chatId = callback.message.chat.id.toString()
  const data = callback.data
  const username = callback.from.username || callback.from.first_name || "Unknown"
  
  const url = new URL(req.url)
  const phoneId = url.searchParams.get("phone_id")
  
  if (!phoneId) {
    return NextResponse.json({ ok: true })
  }
  
  const supabase = createServerClient()
  const { data: phone } = await supabase
    .from("agency_phones")
    .select("*")
    .eq("id", phoneId)
    .single()
    
  if (!phone) {
    return NextResponse.json({ ok: true })
  }
  
  const botToken = phone.telegram_bot_token
  
  // Answer callback to remove loading state
  await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ callback_query_id: callback.id })
  })
  
  if (data === "menu") {
    return handleCommand("/start", chatId, phone, username, phoneId)
  }
  
  if (data === "chat") {
    return handleCommand("/chat", chatId, phone, username, phoneId)
  }
  
  if (data === "billeder") {
    return handleCommand("/billeder", chatId, phone, username, phoneId)
  }
  
  return NextResponse.json({ ok: true })
}
