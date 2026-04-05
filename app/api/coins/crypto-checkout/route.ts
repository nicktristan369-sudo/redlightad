import { NextRequest, NextResponse } from "next/server"
import { COIN_PACKAGES } from "@/lib/coinPackages"
import { importPKCS8, SignJWT } from "jose"
import { randomBytes } from "crypto"

function normalizePem(raw: string): string {
  // Håndter escaped newlines fra Vercel env vars
  let pem = raw.replace(/\\n/g, "\n").replace(/\\r/g, "").trim()

  // Hvis PEM headers mangler, antag PKCS8 private key
  if (!pem.startsWith("-----BEGIN")) {
    const body = pem.replace(/\s/g, "").match(/.{1,64}/g)?.join("\n") ?? pem
    return `-----BEGIN PRIVATE KEY-----\n${body}\n-----END PRIVATE KEY-----\n`
  }

  // Genopbyg PEM med korrekte linjeskift
  const lines = pem.split("\n").map(l => l.trim()).filter(Boolean)
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

    const pemKey = normalizePem(rawPrivateKey)

    // Prøv Ed25519 først, fallback til EC P-256
    let privateKey
    try {
      privateKey = await importPKCS8(pemKey, "EdDSA")
    } catch {
      try {
        privateKey = await importPKCS8(pemKey, "ES256")
      } catch (e2) {
        const msg = e2 instanceof Error ? e2.message : String(e2)
        return NextResponse.json({ error: `Nøgle-fejl: ${msg}` }, { status: 500 })
      }
    }

    const alg = (privateKey.type === "private" && privateKey.algorithm?.name === "Ed25519") ? "EdDSA" : "ES256"
    const nonce = randomBytes(16).toString("hex")
    const now = Math.floor(Date.now() / 1000)

    const jwt = await new SignJWT({
      sub: keyId,
      iss: "cdp",
      nbf: now,
      exp: now + 120,
      uri: "POST api.commerce.coinbase.com/charges",
    })
      .setProtectedHeader({ alg, kid: keyId, typ: "JWT", nonce })
      .sign(privateKey)

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
