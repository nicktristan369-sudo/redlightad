import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const { code } = await req.json()
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  const { data } = await supabase
    .from('promo_codes')
    .select('*')
    .eq('code', code.toUpperCase())
    .eq('is_active', true)
    .single()

  if (!data) return Response.json({ valid: false, error: 'Ugyldig kode' })
  if (data.expires_at && new Date(data.expires_at) < new Date()) return Response.json({ valid: false, error: 'Koden er udløbet' })
  if (data.max_uses && data.used_count >= data.max_uses) return Response.json({ valid: false, error: 'Koden er brugt op' })

  return Response.json({ valid: true, trial_days: data.trial_days, description: data.description })
}
