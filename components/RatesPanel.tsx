"use client"

import { useState } from "react"
import { Coins, ChevronDown } from "lucide-react"

interface Rate {
  duration: string
  price: string
}

// ── Valutaer der tilbydes i vælgeren ──────────────────────────
const CURRENCIES = [
  { code: "DKK", symbol: "kr",  iso: "dk", rate: 1.000 },
  { code: "EUR", symbol: "€",   iso: "eu", rate: 0.134 },
  { code: "USD", symbol: "$",   iso: "us", rate: 0.145 },
  { code: "GBP", symbol: "£",   iso: "gb", rate: 0.115 },
  { code: "SEK", symbol: "kr",  iso: "se", rate: 1.512 },
  { code: "NOK", symbol: "kr",  iso: "no", rate: 1.555 },
  { code: "CHF", symbol: "Fr",  iso: "ch", rate: 0.131 },
  { code: "THB", symbol: "฿",   iso: "th", rate: 5.111 },
  { code: "AED", symbol: "د.إ", iso: "ae", rate: 0.532 },
]

function Flag({ iso, size = 20 }: { iso: string; size?: number }) {
  const h = Math.round(size * 0.75)
  return (
    <img
      src={`https://flagcdn.com/${size * 2}x${h * 2}/${iso}.png`}
      width={size}
      height={h}
      alt={iso}
      style={{ display: "inline-block", borderRadius: 2, objectFit: "cover", border: "1px solid rgba(0,0,0,0.08)", flexShrink: 0 }}
    />
  )
}

const RC_RATE = 10 // 1 DKK = 10 RC

function parseDKK(price: string): number {
  return parseFloat(price.replace(/[^0-9.]/g, "")) || 0
}

function formatAmount(amount: number, code: string): string {
  if (["JPY", "KRW"].includes(code)) return Math.round(amount).toLocaleString()
  if (["DKK", "SEK", "NOK"].includes(code)) return Math.round(amount).toLocaleString("da-DK")
  return amount.toLocaleString("en", { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

// ── Valuta-dropdown ────────────────────────────────────────────
function CurrencyPicker({
  selected,
  onChange,
}: {
  selected: typeof CURRENCIES[0]
  onChange: (c: typeof CURRENCIES[0]) => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] font-semibold transition-all"
        style={{ background: "#fff", border: "1.5px solid #E5E7EB", color: "#111", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}
      >
        <Flag iso={selected.iso} size={18} />
        <span>{selected.code}</span>
        <ChevronDown size={12} color="#9CA3AF" />
      </button>

      {open && (
        <>
          {/* Overlay */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 top-full mt-1.5 z-50 bg-white rounded-xl overflow-hidden"
            style={{ minWidth: 160, boxShadow: "0 8px 30px rgba(0,0,0,0.12)", border: "1px solid #F0F0F0" }}
          >
            {CURRENCIES.map(c => {
              const active = c.code === selected.code
              return (
                <button
                  key={c.code}
                  onClick={() => { onChange(c); setOpen(false) }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                  style={{ background: active ? "#FFF5F5" : "transparent" }}
                  onMouseEnter={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = "#F9FAFB" }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = active ? "#FFF5F5" : "transparent" }}
                >
                  <Flag iso={c.iso} size={18} />
                  <span className="text-[13px] font-semibold" style={{ color: active ? "#DC2626" : "#111" }}>{c.code}</span>
                  <span className="text-[12px] text-gray-400 ml-auto">{c.symbol}</span>
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

// ── Hoved komponent ────────────────────────────────────────────
export default function RatesPanel({
  rates,
  listingId,
  baseCurrency = "DKK",
}: {
  rates: Rate[]
  listingId?: string
  baseCurrency?: string
}) {
  const defaultCurrency = CURRENCIES.find(c => c.code === baseCurrency) ?? CURRENCIES[0]
  const [currency, setCurrency] = useState(defaultCurrency)
  const [mode, setMode] = useState<"fiat" | "rc">("fiat")
  const [loading, setLoading] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  const validRates = rates.filter(r => parseDKK(r.price) > 0)
  if (validRates.length === 0) return null

  // Konverter DKK → valgt valuta
  function convert(dkk: number): string {
    const amount = dkk * currency.rate
    return formatAmount(amount, currency.code)
  }

  async function payRC(rate: Rate) {
    const priceKr = parseDKK(rate.price)
    if (!priceKr || !listingId) return
    setLoading(rate.duration)
    setMsg(null)
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listing_id: listingId, rate_type: rate.duration, price_kr: priceKr }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 401) { window.location.href = "/login"; return }
        setMsg(data.error === "insufficient_coins" ? "Ikke nok RedCoins — køb mere i din wallet." : data.error || "Noget gik galt")
      } else {
        setMsg("Booking bekræftet! ✓")
      }
    } catch { setMsg("Netværksfejl") }
    finally { setLoading(null) }
  }

  return (
    <div className="rounded-xl bg-white overflow-hidden" style={{ border: "1px solid #E5E7EB" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <h3 className="text-[15px] font-bold text-gray-900">Rates</h3>
        <div className="flex items-center gap-2">
          {/* Fiat / RC toggle */}
          <div className="flex rounded-lg overflow-hidden border border-gray-200">
            <button
              onClick={() => setMode("fiat")}
              className="px-3 py-1.5 text-[12px] font-bold transition-colors"
              style={{ background: mode === "fiat" ? "#111" : "#fff", color: mode === "fiat" ? "#fff" : "#6B7280" }}
            >
              Valuta
            </button>
            <button
              onClick={() => setMode("rc")}
              className="flex items-center gap-1 px-3 py-1.5 text-[12px] font-bold transition-colors"
              style={{ background: mode === "rc" ? "#DC2626" : "#fff", color: mode === "rc" ? "#fff" : "#6B7280" }}
            >
              <Coins size={11} /> RC
            </button>
          </div>
          {/* Valuta vælger — kun i fiat mode */}
          {mode === "fiat" && (
            <CurrencyPicker selected={currency} onChange={setCurrency} />
          )}
        </div>
      </div>

      {/* Rate rækker */}
      <div className="divide-y divide-gray-50">
        {validRates.map((rate) => {
          const dkk = parseDKK(rate.price)
          const rc = Math.round(dkk * RC_RATE)
          const isLoading = loading === rate.duration

          return (
            <div key={rate.duration} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors">
              <span className="text-[14px] font-medium text-gray-600">{rate.duration}</span>

              <div className="flex items-center gap-3">
                {mode === "fiat" ? (
                  // Fiat mode: vis konverteret pris
                  <div className="text-right">
                    <span className="text-[17px] font-bold text-gray-900">
                      {convert(dkk)}
                    </span>
                    <span className="text-[12px] text-gray-400 ml-1.5">{currency.code}</span>
                  </div>
                ) : (
                  // RC mode: vis RC pris + betal knap
                  <div className="flex items-center gap-2.5">
                    <div className="text-right">
                      <span className="text-[17px] font-bold" style={{ color: "#DC2626" }}>{rc.toLocaleString()}</span>
                      <span className="text-[12px] text-gray-400 ml-1">RC</span>
                    </div>
                    <button
                      onClick={() => payRC(rate)}
                      disabled={isLoading}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12px] font-bold text-white transition-all"
                      style={{ background: isLoading ? "#9CA3AF" : "#DC2626", minWidth: 64 }}
                    >
                      {isLoading ? (
                        <div className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin mx-auto" />
                      ) : (
                        <><Coins size={11} /> Betal</>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-gray-50">
        {mode === "rc" ? (
          <p className="text-[11px] text-gray-400 flex items-center gap-1">
            <Coins size={11} color="#DC2626" />
            <span>RedCoins = anonym & sikker betaling · 1 DKK = {RC_RATE} RC</span>
          </p>
        ) : (
          <p className="text-[11px] text-gray-400">
            Kurser er vejledende · Priser angivet i {baseCurrency}
          </p>
        )}
      </div>

      {msg && (
        <div className="mx-5 mb-4 px-3 py-2 rounded-lg text-[12px] font-semibold"
          style={{ background: msg.includes("✓") ? "#F0FDF4" : "#FEF2F2", color: msg.includes("✓") ? "#15803D" : "#DC2626" }}>
          {msg}
        </div>
      )}
    </div>
  )
}
