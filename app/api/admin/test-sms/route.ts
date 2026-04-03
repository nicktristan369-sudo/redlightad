import { sendSMS } from '@/lib/sms'

export async function GET() {
  const result = await sendSMS({
    to: '4553602666',
    message: 'Test fra RedLightAD — GatewayAPI virker! 🚀',
    sender: 'REDLIGHTAD',
  })
  return Response.json(result)
}
