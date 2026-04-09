"use client"
import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { Locale, translations, LANGUAGES, TranslationKeys } from "./translations"

interface LanguageContextType {
  locale: Locale
  t: TranslationKeys
  setLocale: (locale: Locale) => void
  languages: typeof LANGUAGES
}

const LanguageContext = createContext<LanguageContextType | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en")

  useEffect(() => {
    const saved = localStorage.getItem("redlightad_locale") as Locale | null
    if (saved && translations[saved]) {
      setLocaleState(saved)
    } else {
      // Default to English — only use saved preference, not browser language
    }
  }, [])

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale)
    localStorage.setItem("redlightad_locale", newLocale)
    document.documentElement.dir = LANGUAGES[newLocale]?.dir === "rtl" ? "rtl" : "ltr"
  }

  return (
    <LanguageContext.Provider value={{ locale, t: translations[locale], setLocale, languages: LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider")
  return ctx
}
