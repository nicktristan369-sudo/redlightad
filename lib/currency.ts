export interface CurrencyConfig {
  code: string
  symbol: string
  rate: number // USD multiplier
}

export const currencyByCountry: Record<string, CurrencyConfig> = {
  dk: { code: "DKK", symbol: "kr",   rate: 6.89 },
  se: { code: "SEK", symbol: "kr",   rate: 10.42 },
  no: { code: "NOK", symbol: "kr",   rate: 10.71 },
  fi: { code: "EUR", symbol: "€",    rate: 0.92 },
  gb: { code: "GBP", symbol: "£",    rate: 0.79 },
  us: { code: "USD", symbol: "$",    rate: 1.00 },
  ca: { code: "CAD", symbol: "CA$",  rate: 1.36 },
  au: { code: "AUD", symbol: "A$",   rate: 1.53 },
  nz: { code: "NZD", symbol: "NZ$",  rate: 1.63 },
  de: { code: "EUR", symbol: "€",    rate: 0.92 },
  fr: { code: "EUR", symbol: "€",    rate: 0.92 },
  nl: { code: "EUR", symbol: "€",    rate: 0.92 },
  be: { code: "EUR", symbol: "€",    rate: 0.92 },
  es: { code: "EUR", symbol: "€",    rate: 0.92 },
  it: { code: "EUR", symbol: "€",    rate: 0.92 },
  pt: { code: "EUR", symbol: "€",    rate: 0.92 },
  at: { code: "EUR", symbol: "€",    rate: 0.92 },
  ch: { code: "CHF", symbol: "Fr",   rate: 0.90 },
  pl: { code: "PLN", symbol: "zł",   rate: 4.02 },
  cz: { code: "CZK", symbol: "Kč",   rate: 22.8 },
  ru: { code: "RUB", symbol: "₽",    rate: 91.0 },
  tr: { code: "TRY", symbol: "₺",    rate: 32.0 },
  th: { code: "THB", symbol: "฿",    rate: 35.2 },
  sg: { code: "SGD", symbol: "S$",   rate: 1.35 },
  jp: { code: "JPY", symbol: "¥",    rate: 149.5 },
  cn: { code: "CNY", symbol: "¥",    rate: 7.24 },
  hk: { code: "HKD", symbol: "HK$",  rate: 7.82 },
  ae: { code: "AED", symbol: "د.إ",  rate: 3.67 },
  sa: { code: "SAR", symbol: "﷼",    rate: 3.75 },
  br: { code: "BRL", symbol: "R$",   rate: 4.97 },
  mx: { code: "MXN", symbol: "MX$",  rate: 17.2 },
  za: { code: "ZAR", symbol: "R",    rate: 18.6 },
  in: { code: "INR", symbol: "₹",    rate: 83.1 },
}

// Fallback for unknown countries
export const DEFAULT_CURRENCY: CurrencyConfig = { code: "USD", symbol: "$", rate: 1.00 }

export function getCurrencyForCountry(countryCode: string): CurrencyConfig {
  return currencyByCountry[countryCode.toLowerCase()] ?? DEFAULT_CURRENCY
}

export function convertPrice(usdAmount: number, currency: CurrencyConfig): string {
  const amount = usdAmount * currency.rate
  const { symbol, code } = currency

  // Format number based on currency
  const formatted = (() => {
    if (["JPY", "KRW", "IDR"].includes(code)) {
      return Math.round(amount).toLocaleString("en")
    }
    if (["DKK", "SEK", "NOK", "PLN", "CZK"].includes(code)) {
      return Math.round(amount).toLocaleString("de-DE") // dot separators
    }
    return amount.toLocaleString("en", { minimumFractionDigits: 0, maximumFractionDigits: 0 })
  })()

  // Symbol placement
  if (["kr", "zł", "Kč", "₽", "₺", "฿", "﷼"].includes(symbol)) {
    return `${formatted} ${symbol}`
  }
  return `${symbol}${formatted}`
}
