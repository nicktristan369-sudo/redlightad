import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import twilio from 'twilio'

const getSupabase = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

function generateToken(): string {
  return Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10)
}

// POST — send SMS til ét eller flere numre
export async function POST(req: NextRequest) {
  const { phone_ids, template } = await req.json()
  // phone_ids: string[] — array af scraped_phones.id
  // template: string — SMS tekst med [TOKEN] placeholder

  const supabase = getSupabase()
  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  const fromNumber = process.env.TWILIO_PHONE_NUMBER!

  const { data: phones, error } = await supabase
    .from('scraped_phones')
    .select('id, phone')
    .in('id', phone_ids)

  if (error || !phones) {
    return Response.json({ error: 'Could not fetch phones' }, { status: 500 })
  }

  const results = []
  let sent = 0
  let failed = 0

  for (const row of phones) {
    const token = generateToken()
    const inviteUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/join/${token}`
    const body = template.replace('[TOKEN]', inviteUrl)

    // Format DK nummer
    let toNumber = row.phone.replace(/\D/g, '')
    if (toNumber.length === 8) toNumber = '+45' + toNumber
    else if (!toNumber.startsWith('+')) toNumber = '+' + toNumber

    try {
      await client.messages.create({ body, from: fromNumber, to: toNumber })

      await supabase
        .from('scraped_phones')
        .update({
          sms_status: 'sent',
          sms_sent_at: new Date().toISOString(),
          invite_token: token,
        })
        .eq('id', row.id)

      results.push({ id: row.id, phone: row.phone, status: 'sent' })
      sent++
    } catch (err: any) {
      results.push({ id: row.id, phone: row.phone, status: 'failed', error: err.message })
      failed++
    }

    // Lille pause mellem sends
    await new Promise(r => setTimeout(r, 200))
  }

  return Response.json({ sent, failed, results })
}
