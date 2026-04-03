import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendSMS } from '@/lib/sms'

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

  const supabase = getSupabase()

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

    const result = await sendSMS({ to: row.phone, message: body })

    if (result.success) {
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
    } else {
      results.push({ id: row.id, phone: row.phone, status: 'failed', error: result.error })
      failed++
    }

    await new Promise(r => setTimeout(r, 200))
  }

  return Response.json({ sent, failed, results })
}
