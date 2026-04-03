import axios from 'axios'

export async function GET() {
  const apiKey = process.env.SCRAPINGBEE_API_KEY
  if (!apiKey) return Response.json({ error: 'No API key — SCRAPINGBEE_API_KEY not set' })

  const params = new URLSearchParams({
    api_key: apiKey,
    url: 'https://annoncelight.dk/showad/347212',
    render_js: 'true',
    premium_proxy: 'true',
  })

  try {
    const { data } = await axios.get(`https://app.scrapingbee.com/api/v1/?${params}`, {
      timeout: 30000,
    })

    const phones = [...(data as string).matchAll(/\b\d{8}\b/g)].map((m: RegExpMatchArray) => m[0])
    const telLinks = [...(data as string).matchAll(/tel:([\d+\s\-]+)/g)].map((m: RegExpMatchArray) => m[1].trim())

    return Response.json({
      success: true,
      phones,
      telLinks,
      htmlPreview: (data as string).slice(0, 500),
    })
  } catch (err: any) {
    return Response.json({ error: err.message, status: err.response?.status })
  }
}
