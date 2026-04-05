import { NextRequest, NextResponse } from "next/server"
import { COIN_PACKAGES } from "@/lib/coinPackages"
import { createHmac, createSign } from "crypto"
import { randomUUID } from "crypto"

// Coinbase Developer Platform (CDP) API — Ed25519 JWT authentication
function buildJWT(keyId: string, privateKeyPem: string): string {
  const now = Math.floor(Date.now() / 1000)
  const header = { alg: "ES256", kid: keyId, typ: "JWT", nonce: randomUUID() }
  const payload = {
    sub: keyId,
    iss: "cdp",
    nbf: now,
    exp: now + 120,
    uri: "POST api.developer.coinbase.com/onramp/v1/buy/quote",
  }

  const encode = (obj: object) =>
    Buffer.from(JSON.stringify(obj)).toString("base64url")

  const headerB64 = encode(header)
  const payloadB64 = encode(payload)
  const signingInput = `${headerB64}.${payloadB64}`

  const sign = createSign("SHA256")
  sign.update(signingInput)
  const signature = sign.sign(privateKeyPem, "base64url")

  return `${signingInput}.${signature}`
}

export async function POST(req: NextRequest) {
  try {
    const { packageId, userId } = await req.json()
    const pkg = COIN_PACKAGES.find(p => p.id === packageId)
    if (!pkg) return NextResponse.json({ error: "Invalid package" }, { status: 400 })

    const keyId = process.env.COINBASE_COMMERCE_API_KEY_ID
    const privateKey = process.env.COINBASE_COMMERCE_PRIVATE_KEY

    if (!keyId || !privateKey) {
      return NextResponse.json({ error: "Crypto payments not configured" }, { status: 503 })
    }

    // Normalize private key (Vercel may store \n as literal string)
    const normalizedKey = privateKey.replace(/\\n/g, "\n")

    const jwt = buildJWT(keyId, normalizedKey)

    const res = await fetch("https://api.commerce.coinbase.com/charges", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${jwt}`,
      },
      body: JSON.stringify({
        name: `${pkg.coins} RedCoins`,
        description: `${pkg.coins} RedCoins til RedLightAD`,
        pricing_type: "fixed_price",
        local_price: { amount: pkg.price_eur.toString(), currency: "EUR" },
        metadata: {
          user_id: userId,
          coins_amount: pkg.coins.toString(),
          package_id: packageId,
        },
        redirect_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/wallet?coins_purchased=true&coins=${pkg.coins}`,
        cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/buy-coins`,
      }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      return NextResponse.json({ error: err?.error?.message || "Coinbase API fejl" }, { status: 500 })
    }

    const data = await res.json()
    return NextResponse.json({ url: data.data?.hosted_url })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
