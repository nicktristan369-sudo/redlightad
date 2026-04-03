import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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
      token = Math.random().toString(36).substring(2, 10).toUpperCase()
      await supabase.from('scraped_phones').update({ invite_token: token }).eq('id', id)
    }

    const inviteUrl = `https://redlightad.com/join/${token}`
    const smsText = template.replace('[TOKEN]', token).replace('[URL]', inviteUrl)

    const phone = contact.phone.replace(/\D/g, '')
    const toNumber = phone.length === 8 ? `+45${phone}` : `+${phone}`

    try {
      const res = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
        {
          method: 'POST',
          headers: {
            Authorization: 'Basic ' + Buffer.from(
              `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
            ).toString('base64'),
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            From: process.env.TWILIO_PHONE_NUMBER!,
            To: toNumber,
            Body: smsText,
          }),
        }
      )

      if (res.ok) {
        await supabase.from('scraped_phones').update({
          sms_status: 'sent',
          sms_sent_at: new Date().toISOString(),
        }).eq('id', id)
        sent++
      } else {
        failed++
      }
    } catch {
      failed++
    }

    await new Promise(r => setTimeout(r, 200))
  }

  return Response.json({ success: true, sent, failed })
}
