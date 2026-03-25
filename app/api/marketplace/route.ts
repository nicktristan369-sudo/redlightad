import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"

async function getAuthClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  )
}

const db = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

// GET: fetch available marketplace items for a listing
export async function GET(req: NextRequest) {
  const listingId = req.nextUrl.searchParams.get("listing_id")
  if (!listingId) return NextResponse.json({ error: "listing_id required" }, { status: 400 })

  const { data, error } = await db()
    .from("marketplace_items")
    .select("*")
    .eq("listing_id", listingId)
    .eq("is_available", true)
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ items: data })
}

// POST: create a new marketplace item
export async function POST(req: NextRequest) {
  try {
    const authClient = await getAuthClient()
    const { data: { user } } = await authClient.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { listing_id, type, title, description, price_redcoins, preview_url } = await req.json()

    // Verify user owns the listing
    const { data: listing } = await db()
      .from("listings")
      .select("id, user_id")
      .eq("id", listing_id)
      .single()

    if (!listing || listing.user_id !== user.id) {
      return NextResponse.json({ error: "Not your listing" }, { status: 403 })
    }

    const { data, error } = await db()
      .from("marketplace_items")
      .insert({ listing_id, type, title, description, price_redcoins, preview_url })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ item: data })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// DELETE: delete a marketplace item
export async function DELETE(req: NextRequest) {
  try {
    const authClient = await getAuthClient()
    const { data: { user } } = await authClient.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { item_id } = await req.json()

    const { data: item } = await db()
      .from("marketplace_items")
      .select("id, listing_id")
      .eq("id", item_id)
      .single()

    if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 })

    const { data: listing } = await db()
      .from("listings")
      .select("user_id")
      .eq("id", item.listing_id)
      .single()

    if (!listing || listing.user_id !== user.id) {
      return NextResponse.json({ error: "Not your item" }, { status: 403 })
    }

    await db().from("marketplace_items").delete().eq("id", item_id)
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// PATCH: update a marketplace item
export async function PATCH(req: NextRequest) {
  try {
    const authClient = await getAuthClient()
    const { data: { user } } = await authClient.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { item_id, is_available, title, price_redcoins } = await req.json()

    const { data: item } = await db()
      .from("marketplace_items")
      .select("id, listing_id")
      .eq("id", item_id)
      .single()

    if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 })

    const { data: listing } = await db()
      .from("listings")
      .select("user_id")
      .eq("id", item.listing_id)
      .single()

    if (!listing || listing.user_id !== user.id) {
      return NextResponse.json({ error: "Not your item" }, { status: 403 })
    }

    const updates: Record<string, unknown> = {}
    if (typeof is_available === "boolean") updates.is_available = is_available
    if (title !== undefined) updates.title = title
    if (price_redcoins !== undefined) updates.price_redcoins = price_redcoins

    const { data, error } = await db()
      .from("marketplace_items")
      .update(updates)
      .eq("id", item_id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ item: data })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
