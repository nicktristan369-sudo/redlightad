import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const { code, plan, months } = await req.json()
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data } = await supabase
    .from('promo_codes')
    .select('*')
    .eq('code', code.toUpperCase().trim())
    .eq('is_active', true)
    .single()

  if (!data) return Response.json({ valid: false, error: 'Invalid promo code' })
  if (data.expires_at && new Date(data.expires_at) < new Date())
    return Response.json({ valid: false, error: 'This code has expired' })
  if (data.max_uses && data.used_count >= data.max_uses)
    return Response.json({ valid: false, error: 'This code has reached its usage limit' })

  // Check if code applies to specific plan
  if (data.applies_to && plan && data.applies_to !== plan)
    return Response.json({ valid: false, error: `This code only applies to the ${data.applies_to.toUpperCase()} plan` })

  return Response.json({
    valid: true,
    code: data.code,
    id: data.id,
    description: data.description,
    discount_type: data.discount_type,       // 'trial' | 'percent' | 'fixed'
    trial_days: data.trial_days,             // for 'trial' type
    discount_percent: data.discount_percent, // for 'percent' type
    discount_fixed: data.discount_fixed,     // for 'fixed' type
    applies_to: data.applies_to,
  })
}
