import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Service role client — bypasser RLS, bruges kun server-side
const getServiceClient = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const userId = formData.get("userId") as string | null
    const fullName = formData.get("fullName") as string | null
    const birthdate = formData.get("birthdate") as string | null

    if (!file || !userId || !fullName || !birthdate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = getServiceClient()

    // Upload fil til kyc-documents bucket via service role
    const ext = file.name.split(".").pop() || "jpg"
    const path = `customer/${userId}/${Date.now()}.${ext}`
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { data: uploadData, error: uploadErr } = await supabase.storage
      .from("kyc-documents")
      .upload(path, buffer, {
        contentType: file.type || "image/jpeg",
        upsert: false,
      })

    if (uploadErr || !uploadData) {
      console.error("Upload error:", uploadErr)
      return NextResponse.json({ error: uploadErr?.message || "Upload failed" }, { status: 500 })
    }

    // Gem KYC request i database
    const { error: insertErr } = await supabase.from("customer_kyc_requests").insert({
      user_id: userId,
      full_name: fullName.trim(),
      birthdate,
      id_image_url: path, // gem sti, ikke public URL (privat bucket)
      status: "pending",
    })

    if (insertErr) {
      console.error("Insert error:", insertErr)
      return NextResponse.json({ error: insertErr.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
