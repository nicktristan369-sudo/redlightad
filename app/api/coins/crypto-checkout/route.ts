import { NextRequest, NextResponse } from "next/server"
import { COIN_PACKAGES } from "@/lib/coinPackages"
import { SignJWT } from "jose"
import { createPrivateKey } from "crypto"
import { randomBytes } from "crypto"

function extractPrivateKey(raw: string): string {
  // Normaliser escaped newlines fra Vercel
  const normalized = raw.replace(/\\n/g, "\n").replace(/\\r/g, "").trim()

  // Hvis det er JSON (hele Coinbase nøglefilen) — udtræk privateKey feltet
  if (normalized.startsWith("{")) {
    try {
      const parsed = JSON.parse(normalized)
      const pk = parsed.privateKey || parsed.private_key || parsed.pem
      if (pk) return extractPrivateKey(pk) // rekursivt normaliser
      throw new Error("Ingen privateKey felt fundet i JSON")
    } catch (e) {
      throw new Error(`JSON parse fejl: ${e instanceof Error ? e.message : e}`)
    }
  }

  // Hvis PEM header mangler — tilføj den
  if (!normalized.startsWith("-----BEGIN")) {
    const body = normalized.replace(/\s/g, "").match(/.{1,64}/g)?.join("\n") ?? normalized
    return `-----BEGIN PRIVATE KEY-----\n${body}\n-----END PRIVATE KEY-----\n`
  }

  // Genopbyg PEM med korrekte 64-char linjeskift
  const lines = normalized.split("\n").map(l => l.trim()).filter(Boolean)
  const header = lines[0]
  const footer = lines[lines.length - 1]
  const body = lines.slice(1, -1).join("").replace(/\s/g, "")
  const formatted = body.match(/.{1,64}/g)?.join("\n") ?? body
  return `${header}\n${formatted}\n${footer}\n`
}

export async function POST(req: NextRequest) {
  try {
    const { packageId, userId } = await req.json()
    const pkg = COIN_PACKAGES.find(p => p.id === packageId)
    if (!pkg) return NextResponse.json({ error: "Invalid package" }, { status: 400 })

    const keyId = process.env.COINBASE_COMMERCE_API_KEY_ID
    const rawPrivateKey = process.env.COINBASE_COMMERCE_PRIVATE_KEY

    if (!keyId || !rawPrivateKey) {
      return NextResponse.json({ error: "Crypto betaling ikke konfigureret" }, { status: 503 })
    }

    // Udtræk og normaliser private key
    let pemKey: string
    try {
      pemKey = extractPrivateKey(rawPrivateKey)
    } catch (e) {
      return NextResponse.json({ error: `Key-format fejl: ${e instanceof Error ? e.message : e}` }, { status: 500 })
    }

    // Node.js crypto håndterer både EC SEC1 og PKCS8 formater automatisk
    let nodeKey: ReturnType<typeof createPrivateKey>
    try {
      nodeKey = createPrivateKey(pemKey)
    } catch (e) {
      return NextResponse.json({ error: `Key load fejl: ${e instanceof Error ? e.message : e}` }, { status: 500 })
    }

    // Bestem algoritme ud fra nøgletype
    const keyType = nodeKey.asymmetricKeyType
    const alg = keyType === "ed25519" ? "EdDSA" : "ES256"

    const nonce = randomBytes(16).toString("hex")
    const now = Math.floor(Date.now() / 1000)

    // jose accepterer KeyObject direkte fra Node.js crypto
    const jwt = await new SignJWT({
      sub: keyId,
      iss: "cdp",
      nbf: now,
      exp: now + 120,
      uri: "POST api.commerce.coinbase.com/charges",
    })
      .setProtectedHeader({ alg, kid: keyId, typ: "JWT", nonce })
      .sign(nodeKey)

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
      const msg = err?.error?.message || `Coinbase fejl (${res.status})`
      return NextResponse.json({ error: msg }, { status: 500 })
    }

    const data = await res.json()
    return NextResponse.json({ url: data.data?.hosted_url })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
