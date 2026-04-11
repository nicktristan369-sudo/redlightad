interface SendSMSOptions {
  to: string
  message: string
  sender?: string
}

interface SMSResult {
  success: boolean
  messageId?: string
  error?: string
}

// European country codes that support alphanumeric sender IDs
const EU_PREFIXES = ['45','46','47','358','44','49','33','31','34','39','48','43','32','41','420','36','40','30','351','380','7','90']

function normalizePhone(to: string): string {
  let phone = to.replace(/[\s\-\.\(\)]/g, '')
  if (phone.startsWith('+')) phone = phone.slice(1)
  if (phone.startsWith('00')) phone = phone.slice(2)
  if (phone.length === 8 && /^[2-9]/.test(phone)) phone = '45' + phone
  else if (phone.length === 9 && phone.startsWith('0')) phone = '45' + phone.slice(1)
  else if (phone.length === 10 && phone.startsWith('0')) phone = '66' + phone.slice(1)
  return phone
}

export async function sendSMS({ to, message, sender = process.env.GATEWAYAPI_SENDER || 'REDLIGHTAD' }: SendSMSOptions): Promise<SMSResult> {
  const token = process.env.GATEWAYAPI_TOKEN
  if (!token) return { success: false, error: 'No GatewayAPI token' }

  const phone = normalizePhone(to)
  const isEU = EU_PREFIXES.some(prefix => phone.startsWith(prefix))
  const effectiveSender = isEU ? sender : '1234'

  try {
    const response = await fetch('https://gatewayapi.com/rest/mtsms', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender: effectiveSender,
        message,
        recipients: [{ msisdn: parseInt(phone, 10) }],
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('GatewayAPI error:', JSON.stringify(data))
      return { success: false, error: data.message || data.code || JSON.stringify(data) }
    }

    return {
      success: true,
      messageId: data.ids?.[0]?.toString() ?? data.id?.toString(),
    }
  } catch (err: unknown) {
    return { success: false, error: (err as Error).message }
  }
}

export async function sendBulkSMS(
  recipients: Array<{ id: string; phone: string }>,
  message: string,
  sender = process.env.GATEWAYAPI_SENDER || 'REDLIGHTAD'
): Promise<{ sent: number; failed: number; errors: string[] }> {
  let sent = 0
  let failed = 0
  const errors: string[] = []

  for (const recipient of recipients) {
    const result = await sendSMS({ to: recipient.phone, message, sender })
    if (result.success) { sent++ } else { failed++; errors.push(`${recipient.phone}: ${result.error}`) }
    await new Promise(r => setTimeout(r, 100))
  }

  return { sent, failed, errors }
}
