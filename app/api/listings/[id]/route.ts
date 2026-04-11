export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const getAdmin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const token = req.headers.get("authorization")?.replace("Bearer ", "")
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: { user } } = await getAdmin().auth.getUser(token)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: listing } = await getAdmin()
    .from("listings").select("id, user_id").eq("id", id).maybeSingle()

  if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (listing.user_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { error } = await getAdmin().from("listings").delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const token = req.headers.get("authorization")?.replace("Bearer ", "")
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: { user } } = await getAdmin().auth.getUser(token)
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()

  const { data: listing } = await getAdmin()
    .from("listings").select("id, user_id").eq("id", id).maybeSingle()

  if (!listing) return NextResponse.json({ error: "Not found" }, { status: 404 })
  if (listing.user_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { error } = await getAdmin().from("listings").update(body).eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
