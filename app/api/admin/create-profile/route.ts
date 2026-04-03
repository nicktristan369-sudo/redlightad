import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendSMS } from '@/lib/sms'

const getSupabase = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

function generatePassword(): string {
  const words = ['Rose', 'Luna', 'Star', 'Nova', 'Ruby', 'Jade', 'Aria']
  const word = words[Math.floor(Math.random() * words.length)]
  const num = Math.floor(1000 + Math.random() * 9000)
  return `${word}#${num}`
}

function generateEmail(name: string, phone: string): string {
  const clean = name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10) || 'user'
  const suffix = phone.replace(/\D/g, '').slice(-4)
  return `${clean}${suffix}@redlightad.com`
}

function generateUsername(displayName: string): string {
  const base = displayName
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 12)
  return base + Math.floor(Math.random() * 999)
}

export async function POST(req: NextRequest) {
  const { profile, sendSMSNotification } = await req.json()

  const supabase = getSupabase()
  const password = generatePassword()
  const username = generateUsername(profile.display_name || 'user')
  const email = profile.email || generateEmail(profile.display_name || 'user', profile.phone || '')

  // Opret bruger i Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      display_name: profile.display_name,
      username,
      created_by_admin: true,
    },
  })

  if (authError) {
    return Response.json({ error: authError.message }, { status: 500 })
  }

  const userId = authData.user.id

  // Opret profil record
  await supabase.from('profiles').upsert({
    id: userId,
    username,
    display_name: profile.display_name,
    phone: profile.phone,
    city: profile.city,
    age: profile.age,
    bio: profile.description,
    source_url: profile.source_url,
    created_by_admin: true,
  })

  // Anvend GRATIS30 promo kode
  const { data: promoCode } = await supabase
    .from('promo_codes')
    .select('id')
    .eq('code', 'GRATIS30')
    .single()

  if (promoCode) {
    await supabase.from('promo_code_uses').insert({ code_id: promoCode.id, user_id: userId })
    await supabase.from('promo_codes').update({ used_count: supabase.rpc('increment', { x: 1 }) }).eq('id', promoCode.id)
  }

  // Send SMS med login info
  if (sendSMSNotification && profile.phone) {
    const smsMessage = `Hej! Din profil på RedLightAD er klar. Log ind med:\nEmail: ${email}\nKode: ${password}\nredlightad.com/login\n\nDu har 30 dages gratis adgang med kode: GRATIS30`

    await sendSMS({
      to: profile.phone,
      message: smsMessage,
      sender: 'REDLIGHTAD',
    })
  }

  return Response.json({
    success: true,
    userId,
    username,
    email,
    password,
    smsStatus: sendSMSNotification ? 'sent' : 'skipped',
  })
}
