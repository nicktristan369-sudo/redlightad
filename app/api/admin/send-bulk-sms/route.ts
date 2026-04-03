import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendSMS } from '@/lib/sms'

const getSupabase = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

export async function POST(req: NextRequest) {
  const { phoneIds, template } = await req.json()
  const supabase = getSupabase()
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
        } catch {}
      }

      let sent = 0
      let failed = 0

      send({ type: 'start', total: phoneIds.length })

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
        const message = template
          .replace('[URL]', inviteUrl)
          .replace('[TOKEN]', token)

        const result = await sendSMS({ to: contact.phone, message, sender: 'REDLIGHTAD' })

        if (result.success) {
          sent++
          await supabase.from('scraped_phones').update({
            sms_status: 'sent',
            sms_sent_at: new Date().toISOString(),
          }).eq('id', id)
        } else {
          failed++
        }

        send({ type: 'progress', sent, failed, total: phoneIds.length, current: contact.phone })
        await new Promise(r => setTimeout(r, 150))
      }

      send({ type: 'done', sent, failed })
      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
  })
}
