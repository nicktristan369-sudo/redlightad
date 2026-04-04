import { NextRequest, NextResponse } from "next/server"
import { createClient as createServerClient } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase"

const serviceClient = () => createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST — send besked til en profil (opretter/genbruger conversation)
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { listing_id, content } = body
  if (!listing_id || !content?.trim()) {
    return NextResponse.json({ error: "listing_id og content er påkrævet" }, { status: 400 })
  }

  const admin = serviceClient()

  // Find profil-ejeren (provider_id) fra listings
  const { data: listing, error: listingErr } = await admin
    .from("listings")
    .select("user_id, title")
    .eq("id", listing_id)
    .single()

  if (listingErr || !listing) {
    return NextResponse.json({ error: "Profil ikke fundet" }, { status: 404 })
  }

  const providerId = listing.user_id
  const customerId = user.id

  // Ingen selvbesked
  if (providerId === customerId) {
    return NextResponse.json({ error: "Du kan ikke sende besked til dig selv" }, { status: 400 })
  }

  // Find eller opret conversation
  let conversationId: string
  const { data: existing } = await admin
    .from("conversations")
    .select("id")
    .eq("listing_id", listing_id)
    .eq("provider_id", providerId)
    .eq("customer_id", customerId)
    .single()

  if (existing) {
    conversationId = existing.id
  } else {
    const { data: newConv, error: convErr } = await admin
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
      return NextResponse.json({ error: "Kunne ikke oprette samtale" }, { status: 500 })
    }
    conversationId = newConv.id
  }

  // Indsæt besked
  const { error: msgErr } = await admin
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: customerId,
      content: content.trim(),
      read: false,
      created_at: new Date().toISOString(),
    })

  if (msgErr) {
    return NextResponse.json({ error: "Kunne ikke sende beskeden" }, { status: 500 })
  }

  // Opdater conversation: last_message + provider_unread ++
  await admin
    .from("conversations")
    .update({
      last_message: content.trim(),
      last_message_at: new Date().toISOString(),
      provider_unread: (existing ? undefined : 1),
    })
    .eq("id", conversationId)

  // Increment provider_unread med rpc hvis existing
  if (existing) {
    await admin.rpc("increment_provider_unread", { conv_id: conversationId })
      .then(() => {}) // best effort — fejler stille hvis rpc ikke eksisterer
  }

  return NextResponse.json({ ok: true, conversation_id: conversationId })
}
