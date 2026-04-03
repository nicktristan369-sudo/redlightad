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

export async function sendSMS({ to, message, sender = process.env.GATEWAYAPI_SENDER || 'REDLIGHTAD' }: SendSMSOptions): Promise<SMSResult> {
  const token = process.env.GATEWAYAPI_TOKEN
  if (!token) return { success: false, error: 'No GatewayAPI token' }

  // Normaliser nummer til MSISDN format (landekode uden +)
  let phone = to.replace(/[\s\-\.\(\)]/g, '')
  if (phone.startsWith('+')) phone = phone.slice(1)
  if (phone.startsWith('00')) phone = phone.slice(2)
  if (phone.length === 8) phone = '45' + phone

  try {
    const response = await fetch('https://gatewayapi.com/rest/mtsms', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender,
        message,
        recipients: [{ msisdn: parseInt(phone) }],
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('GatewayAPI error:', data)
      return { success: false, error: data.message || data.code || 'SMS fejlede' }
    }

    return {
      success: true,
      messageId: data.ids?.[0]?.toString(),
    }
  } catch (err: any) {
    return { success: false, error: err.message }
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

    if (result.success) {
      sent++
    } else {
      failed++
      errors.push(`${recipient.phone}: ${result.error}`)
    }

    await new Promise(r => setTimeout(r, 100))
  }

  return { sent, failed, errors }
}
