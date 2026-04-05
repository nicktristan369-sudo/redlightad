import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

async function getAuthClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  )
}

const serviceClient = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const supabase = await getAuthClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get("file") as File
  const listingId = formData.get("listingId") as string
  const type = formData.get("type") as string // "cover" | "teaser"

  if (!file || !listingId) return NextResponse.json({ error: "Missing fields" }, { status: 400 })

  const ext = file.name.split(".").pop() || "mp4"
  const path = `onlyfans/${type}/${listingId}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const admin = serviceClient()
  const { data, error } = await admin.storage.from("media").upload(path, buffer, {
    contentType: file.type,
    upsert: true,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: urlData } = admin.storage.from("media").getPublicUrl(data.path)
  return NextResponse.json({ url: urlData.publicUrl })
}
