import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const getServiceClient = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

export async function GET(req: NextRequest) {
  const path = req.nextUrl.searchParams.get("path")
  if (!path) return NextResponse.json({ error: "No path" }, { status: 400 })

  const supabase = getServiceClient()
  const { data, error } = await supabase.storage
    .from("kyc-documents")
    .createSignedUrl(path, 3600)

  if (error || !data)
    return NextResponse.json({ error: "Failed to generate signed URL" }, { status: 500 })

  return NextResponse.json({ url: data.signedUrl })
}
