import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const getAdmin = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  const supabase = getAdmin()
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "site_lock_enabled")
    .single()

  return NextResponse.json({ enabled: data?.value === "true" })
}

export async function POST(req: NextRequest) {
  const { enabled } = await req.json()
  const supabase = getAdmin()

  await supabase
    .from("site_settings")
    .upsert({ key: "site_lock_enabled", value: String(enabled) }, { onConflict: "key" })

  return NextResponse.json({ ok: true, enabled })
}
