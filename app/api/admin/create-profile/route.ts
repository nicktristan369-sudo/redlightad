import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendSMS } from '@/lib/sms'

const getSupabase = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

function generateCredentials() {
  const loginId = 'user_' + Math.random().toString(36).substring(2, 8)
  const email = `${loginId}@redlightad.com`
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789'
  const password = Array.from(
    { length: 12 },
    () => chars[Math.floor(Math.random() * chars.length)]
  ).join('')
  return { loginId, email, password }
}

export async function POST(req: NextRequest) {
  const { profile, sendSMSNotification } = await req.json()

  const supabase = getSupabase()
  const { loginId, email, password } = generateCredentials()

  // Opret bruger i Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      display_name: profile.display_name,
      login_id: loginId,
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
    username: loginId,
    display_name: profile.display_name,
    phone: profile.phone,
    city: profile.city,
    age: profile.age,
    bio: profile.description,
    source_url: profile.source_url,
    created_by_admin: true,
  })

  // Opret listing — gem credentials så admin altid kan finde dem
  const { data: listingData, error: listingError } = await supabase
    .from('listings')
    .insert({
      user_id: userId,
      display_name: profile.display_name,
      phone: profile.phone,
      city: profile.city,
      country: profile.country || 'Denmark',
      age: profile.age,
      about: profile.description,
      source_url: profile.source_url,
      category: profile.category || 'escort',
      status: 'active',
      created_by_admin: true,
      needs_completion: true,
      admin_email: email,
      admin_password: password,
      admin_login_id: loginId,
    })
    .select()

  console.log('Listing insert result:', listingData, listingError)

  if (listingError) {
    console.error('LISTING INSERT ERROR:', JSON.stringify(listingError))
    return Response.json({ error: 'Bruger oprettet men listing fejlede: ' + listingError.message }, { status: 500 })
  }

  // Anvend GRATIS30 promo kode
  const { data: promoCode } = await supabase
    .from('promo_codes')
    .select('id')
    .eq('code', 'GRATIS30')
    .single()

  if (promoCode) {
    await supabase.from('promo_code_uses').insert({ code_id: promoCode.id, user_id: userId })
  }

  // Send SMS med login info
  if (sendSMSNotification && profile.phone) {
    const smsMessage = `Hej! Din profil på RedLightAD er klar.\n\nLog ind på: redlightad.com/login\nBrugernavn: ${email}\nKode: ${password}\n\n30 dages gratis adgang med kode: GRATIS30`
    await sendSMS({ to: profile.phone, message: smsMessage, sender: 'REDLIGHTAD' })
  }

  return Response.json({
    success: true,
    userId,
    loginId,
    email,
    password,
    phone: profile.phone,
    smsStatus: sendSMSNotification ? 'sent' : 'skipped',
  })
}
