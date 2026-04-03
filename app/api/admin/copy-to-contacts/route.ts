import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const getSupabase = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

export async function POST(req: NextRequest) {
  const { ids, country = 'Denmark' } = await req.json()
  const supabase = getSupabase()

  let query = supabase.from('scraped_phones').select('phone, source_domain, source_url')
  if (ids && ids.length > 0) {
    query = query.in('id', ids)
  } else {
    query = query.eq('sms_status', 'pending')
  }

  const { data: scraped, error } = await query
  if (error) return Response.json({ error: error.message }, { status: 500 })

  // Duplicate check against existing contacts
  const { data: existing } = await supabase.from('admin_contacts').select('phone')
  const existingPhones = new Set((existing || []).map((r: any) => r.phone?.replace(/\D/g, '')))

  const toInsert = (scraped || [])
    .filter(r => !existingPhones.has(r.phone?.replace(/\D/g, '')))
    .map(r => ({
      name: r.phone,
      phone: r.phone,
      country,
      source_domain: r.source_domain || '',
      source: 'scraped',
      category: 'other',
    }))

  if (toInsert.length === 0) {
    return Response.json({ added: 0, skipped: (scraped || []).length })
  }

  const { error: insertError } = await supabase.from('admin_contacts').insert(toInsert)
  if (insertError) return Response.json({ error: insertError.message }, { status: 500 })

  return Response.json({ added: toInsert.length, skipped: (scraped || []).length - toInsert.length })
}
