"use client"

import { useState, useEffect } from "react"
import { getCurrencyForCountry, CurrencyConfig, DEFAULT_CURRENCY } from "./currency"

export function useCurrency(): CurrencyConfig {
  const [currency, setCurrency] = useState<CurrencyConfig>(DEFAULT_CURRENCY)

  useEffect(() => {
    const stored = localStorage.getItem("redlightad_country")
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        if (parsed?.code) setCurrency(getCurrencyForCountry(parsed.code))
      } catch { /* ignore */ }
    }
  }, [])

  return currency
}
