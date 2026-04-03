import { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  const token = process.env.REPLICATE_API_TOKEN
  if (!token) return Response.json({ error: 'REPLICATE_API_TOKEN not set' }, { status: 500 })

  // Test med et simpelt offentligt billede
  const testImageUrl = 'https://replicate.delivery/pbxt/test-watermark.jpg'

  try {
    const startRes = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: '95b7223104132402a9ae91cc677285bc5eb997834bd2349fa486f53910fd68b3',
        input: {
          image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/PNG_transparency_demonstration_1.png/280px-PNG_transparency_demonstration_1.png',
          mask: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/PNG_transparency_demonstration_1.png/280px-PNG_transparency_demonstration_1.png',
          prompt: 'clean background',
        },
      }),
    })

    const prediction = await startRes.json()
    return Response.json({
      status: startRes.status,
      token_set: true,
      prediction_id: prediction.id,
      prediction_status: prediction.status,
      error: prediction.detail || prediction.error || null,
      urls: prediction.urls,
    })
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
  }
}
