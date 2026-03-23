import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"

const getClient = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

export async function GET(req: NextRequest) {
  try {
    const supabase = getClient()
    const country = req.nextUrl.searchParams.get("country")

    if (country) {
      // Return cities for a given country
      const { data, error } = await supabase
        .from("listings")
        .select("city")
        .ilike("country", country)
        .eq("status", "active")
        .not("city", "is", null)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      const cities = [...new Set(data?.map(r => r.city).filter(Boolean) as string[])]
        .sort()
        .map(name => ({ name }))

      return NextResponse.json({ cities })
    }

    // Return all distinct countries
    const { data, error } = await supabase
      .from("listings")
      .select("country")
      .eq("status", "active")
      .not("country", "is", null)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const countries = [...new Set(data?.map(r => r.country).filter(Boolean) as string[])]
      .sort()
      .map(name => ({ name }))

    return NextResponse.json({ countries })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
