import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabaseServer"
import OpenAI from "openai"

// Lazy init to avoid build-time errors
function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "" })
}

export async function POST(req: NextRequest) {
  const supabase = createServerClient()
  
  try {
    const body = await req.json()
    const { phone_id, from_number, message, timestamp, device_id, api_key } = body

    if (!phone_id || !from_number || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Verify phone exists and get settings
    const { data: phone, error: phoneError } = await supabase
      .from("agency_phones")
      .select("*")
      .eq("id", phone_id)
      .single()

    if (phoneError || !phone) {
      return NextResponse.json({ error: "Phone not found" }, { status: 404 })
    }

    // Check if number is blocked
    const { data: blocked } = await supabase
      .from("agency_blocked_numbers")
      .select("id")
      .or(`phone_id.is.null,phone_id.eq.${phone_id}`)
      .eq("blocked_number", from_number)
      .limit(1)

    if (blocked && blocked.length > 0) {
      return NextResponse.json({ ok: true, action: "blocked" })
    }

    // Get or create conversation
    let { data: conversation } = await supabase
      .from("agency_conversations")
      .select("*")
      .eq("phone_id", phone_id)
      .eq("customer_phone", from_number)
      .single()

    if (!conversation) {
      const { data: newConv } = await supabase
        .from("agency_conversations")
        .insert({
          phone_id,
          customer_phone: from_number,
          status: "ai_handling",
        })
        .select()
        .single()
      conversation = newConv
    }

    if (!conversation) {
      return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 })
    }

    // Save inbound message
    await supabase.from("agency_messages").insert({
      conversation_id: conversation.id,
      phone_id,
      direction: "inbound",
      content: message,
      status: "received",
      sent_by: "customer",
      received_at: timestamp || new Date().toISOString(),
    })

    // Update conversation
    await supabase
      .from("agency_conversations")
      .update({
        message_count: (conversation.message_count || 0) + 1,
        last_message_at: new Date().toISOString(),
      })
      .eq("id", conversation.id)

    // Check keywords for notifications
    const { data: keywords } = await supabase
      .from("agency_keywords")
      .select("*")
      .or(`phone_id.is.null,phone_id.eq.${phone_id}`)
      .eq("is_active", true)

    const messageLower = message.toLowerCase()
    const matchedKeywords = (keywords || []).filter(kw => {
      if (kw.match_type === "exact") return messageLower === kw.keyword.toLowerCase()
      if (kw.match_type === "contains") return messageLower.includes(kw.keyword.toLowerCase())
      if (kw.match_type === "regex") {
        try { return new RegExp(kw.keyword, "i").test(message) }
        catch { return false }
      }
      return false
    })

    // Create notifications for matched keywords
    for (const kw of matchedKeywords) {
      await supabase.from("agency_notifications").insert({
        phone_id,
        conversation_id: conversation.id,
        type: "keyword_match",
        title: `🔔 Keyword: "${kw.keyword}"`,
        body: `${from_number}: ${message.substring(0, 100)}`,
      })

      // If action is takeover, switch conversation to manual
      if (kw.action === "takeover") {
        await supabase
          .from("agency_conversations")
          .update({ status: "manual", is_flagged: true, flag_reason: `Keyword: ${kw.keyword}` })
          .eq("id", conversation.id)
      }
    }

    // If AI is enabled and conversation is in AI mode, generate response
    let aiResponse: string | null = null
    let scheduledSendAt: string | null = null

    if (phone.ai_enabled && conversation.status === "ai_handling") {
      // Generate AI response
      aiResponse = await generateAIResponse(phone, message, conversation.id, supabase)

      if (aiResponse) {
        // Calculate random delay
        const delayMin = phone.ai_response_delay_min || 45
        const delayMax = phone.ai_response_delay_max || 90
        const delay = Math.floor(Math.random() * (delayMax - delayMin + 1)) + delayMin
        scheduledSendAt = new Date(Date.now() + delay * 1000).toISOString()

        // Save AI response (pending send)
        await supabase.from("agency_messages").insert({
          conversation_id: conversation.id,
          phone_id,
          direction: "outbound",
          content: aiResponse,
          status: "pending",
          sent_by: "ai",
          ai_generated: true,
          scheduled_send_at: scheduledSendAt,
        })
      }
    }

    return NextResponse.json({
      ok: true,
      conversation_id: conversation.id,
      ai_response: aiResponse,
      scheduled_send_at: scheduledSendAt,
      keywords_matched: matchedKeywords.map(k => k.keyword),
    })

  } catch (error) {
    console.error("SMS inbound error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function generateAIResponse(
  phone: any,
  userMessage: string,
  conversationId: string,
  supabase: any
): Promise<string | null> {
  try {
    // Get conversation history (last 10 messages)
    const { data: history } = await supabase
      .from("agency_messages")
      .select("direction, content, sent_by")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .limit(10)

    const messages = (history || []).reverse().map((m: any) => ({
      role: m.direction === "inbound" ? "user" : "assistant",
      content: m.content,
    }))

    // Check custom Q&A first
    const customQA = phone.custom_qa || []
    const userLower = userMessage.toLowerCase()
    for (const qa of customQA) {
      if (userLower.includes(qa.q.toLowerCase())) {
        return qa.a
      }
    }

    // Check templates
    const { data: templates } = await supabase
      .from("agency_ai_templates")
      .select("*")
      .or(`phone_id.is.null,phone_id.eq.${phone.id}`)
      .eq("is_active", true)

    for (const template of templates || []) {
      const triggers = template.trigger_phrases || []
      for (const trigger of triggers) {
        if (userLower.includes(trigger.toLowerCase())) {
          const responses = template.response_templates || []
          if (responses.length > 0) {
            return responses[Math.floor(Math.random() * responses.length)]
          }
        }
      }
    }

    // Build system prompt from persona
    const systemPrompt = `Du er ${phone.persona_name}, en ${phone.persona_age || ""}${phone.persona_age ? " år gammel " : ""}${phone.persona_gender === "female" ? "kvinde" : phone.persona_gender === "male" ? "mand" : "person"}.

Personlighed: ${phone.persona_personality || "venlig og imødekommende"}

Detaljer om dig:
- Lokation: ${phone.persona_location || "ikke angivet"}
- Nationalitet: ${phone.persona_nationality || "ikke angivet"}
- Højde: ${phone.persona_height || "ikke angivet"}
- Vægt: ${phone.persona_weight || "ikke angivet"}

${phone.persona_description || ""}

VIGTIGE REGLER:
1. Svar ALTID på dansk med mindre kunden skriver på et andet sprog
2. Vær ${phone.ai_style === "flirty" ? "flirtende og charmerende" : phone.ai_style === "professional" ? "professionel og forretningsmæssig" : "venlig og afslappet"}
3. Hold svarene korte og naturlige som SMS-beskeder (maks 2-3 sætninger)
4. Brug ALDRIG emojis i overdreven grad - max 1 per besked
5. Skriv som et rigtigt menneske, ikke som en robot
6. Hvis du ikke ved svaret, sig at du vender tilbage eller bed dem kontakte dig på et andet tidspunkt
7. Del ALDRIG personlige oplysninger der ikke er givet i din profil
8. Hvis nogen spørger om priser eller services, vær vag og foreslå at de kontakter dig for mere info

Skriv nu et naturligt svar på kundens besked.`

    // Add user message to history
    messages.push({ role: "user", content: userMessage })

    const response = await getOpenAI().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      max_tokens: 150,
      temperature: 0.8,
    })

    return response.choices[0]?.message?.content || null

  } catch (error) {
    console.error("AI generation error:", error)
    return null
  }
}
