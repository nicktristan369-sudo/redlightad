import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { messageRateLimit, getClientIP } from "@/lib/rate-limit"
import { sendEmail, newMessageEmail } from "@/lib/email"

export const dynamic = "force-dynamic"

const admin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST — send besked til en profil
export async function POST(req: NextRequest) {
  // Rate limiting - 30 messages per minute
  const ip = getClientIP(req)
  const { success: rateLimitOk } = await messageRateLimit.limit(ip)
  if (!rateLimitOk) {
    return NextResponse.json(
      { error: "Too many messages. Please wait a moment." },
      { status: 429 }
    )
  }

  // Hent auth token fra Authorization header
  const authHeader = req.headers.get("authorization") ?? ""
  const token = authHeader.replace("Bearer ", "").trim()

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Verificer token via Supabase
  const { data: { user }, error: authErr } = await admin().auth.getUser(token)
  if (authErr || !user) {
    return NextResponse.json({ error: "Ugyldig session — log ind igen" }, { status: 401 })
  }

  const body = await req.json()
  const { listing_id, content } = body

  if (!listing_id || !content?.trim()) {
    return NextResponse.json({ error: "listing_id og content er påkrævet" }, { status: 400 })
  }

  const db = admin()

  // Find profilens ejer
  const { data: listing, error: listingErr } = await db
    .from("listings")
    .select("user_id, title")
    .eq("id", listing_id)
    .single()

  if (listingErr || !listing) {
    return NextResponse.json({ error: "Profil ikke fundet" }, { status: 404 })
  }

  const providerId = listing.user_id
  const customerId = user.id

  if (providerId === customerId) {
    return NextResponse.json({ error: "Du kan ikke sende besked til dig selv" }, { status: 400 })
  }

  // Find eller opret conversation
  let conversationId: string

  const { data: existing } = await db
    .from("conversations")
    .select("id, provider_unread")
    .eq("listing_id", listing_id)
    .eq("provider_id", providerId)
    .eq("customer_id", customerId)
    .maybeSingle()

  if (existing) {
    conversationId = existing.id
    // Opdater last_message + unread
    await db.from("conversations").update({
      last_message: content.trim(),
      last_message_at: new Date().toISOString(),
      provider_unread: (existing.provider_unread ?? 0) + 1,
    }).eq("id", conversationId)
  } else {
    const { data: newConv, error: convErr } = await db
      .from("conversations")
      .insert({
        listing_id,
        provider_id: providerId,
        customer_id: customerId,
        last_message: content.trim(),
        last_message_at: new Date().toISOString(),
        provider_unread: 1,
        customer_unread: 0,
      })
      .select("id")
      .single()

    if (convErr || !newConv) {
      console.error("conversation insert error:", convErr)
      return NextResponse.json({ error: "Kunne ikke oprette samtale: " + convErr?.message }, { status: 500 })
    }
    conversationId = newConv.id
  }

  // Indsæt besked
  const { error: msgErr } = await db
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: customerId,
      content: content.trim(),
      created_at: new Date().toISOString(),
    })

  if (msgErr) {
    console.error("message insert error:", msgErr)
    return NextResponse.json({ error: "Kunne ikke gemme beskeden: " + msgErr.message }, { status: 500 })
  }

  // Send email notification to provider (fire-and-forget)
  try {
    // Get provider email and name
    const { data: providerProfile } = await db
      .from("profiles")
      .select("email, full_name, email_notifications")
      .eq("id", providerId)
      .single()

    // Get customer name
    const { data: customerProfile } = await db
      .from("profiles")
      .select("full_name")
      .eq("id", customerId)
      .single()

    // Only send if provider has email notifications enabled (default true)
    if (providerProfile?.email && providerProfile.email_notifications !== false) {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://redlightad.com"
      const emailData = newMessageEmail({
        recipientName: providerProfile.full_name || "Provider",
        senderName: customerProfile?.full_name || "A customer",
        messagePreview: content.trim(),
        conversationUrl: `${siteUrl}/dashboard/messages/${conversationId}`,
      })

      sendEmail({
        to: providerProfile.email,
        subject: emailData.subject,
        html: emailData.html,
      }).catch(err => console.error("[Email] notification error:", err))
    }
  } catch (emailErr) {
    // Don't fail the request if email fails
    console.error("[Email] notification error:", emailErr)
  }

  return NextResponse.json({ ok: true, conversation_id: conversationId })
}
