import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendSMS } from '@/lib/sms'

const getSupabase = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

function generateToken(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase() +
         Math.random().toString(36).substring(2, 6).toUpperCase()
}

export async function POST(req: NextRequest) {
  const { phoneIds, template } = await req.json()
  const supabase = getSupabase()
  let sent = 0, failed = 0

  for (const id of phoneIds) {
    const { data: contact } = await supabase
      .from('scraped_phones')
      .select('*')
      .eq('id', id)
      .single()

    if (!contact) continue

    let token = contact.invite_token
    if (!token) {
      token = generateToken()
      await supabase.from('scraped_phones').update({ invite_token: token }).eq('id', id)
    }

    const inviteUrl = `https://redlightad.com/join/${token}`
    const smsText = template
      .replace('[TOKEN]', token)
      .replace('[URL]', inviteUrl)

    const result = await sendSMS({ to: contact.phone, message: smsText })

    if (result.success) {
      await supabase.from('scraped_phones').update({
        sms_status: 'sent',
        sms_sent_at: new Date().toISOString(),
      }).eq('id', id)
      sent++
    } else {
      console.error('SMS failed for', contact.phone, result.error)
      failed++
    }
  }

  return Response.json({ success: true, sent, failed })
}
