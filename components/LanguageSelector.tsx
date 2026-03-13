"use client"
import { useState, useRef, useEffect } from "react"
import { useLanguage } from "@/lib/i18n/LanguageContext"
import { Locale } from "@/lib/i18n/translations"

export default function LanguageSelector() {
  const { locale, setLocale, languages } = useLanguage()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const current = languages[locale]

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 hover:border-gray-300 bg-white text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
      >
        <span className="text-base">{current.flag}</span>
        <span className="hidden sm:block">{current.name}</span>
        <span className="text-gray-400 text-xs">{"\u25BC"}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          <div className="py-1 max-h-80 overflow-y-auto">
            {(Object.entries(languages) as [Locale, typeof languages[Locale]][]).map(([code, lang]) => (
              <button
                key={code}
                onClick={() => { setLocale(code); setOpen(false) }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-gray-50 transition-colors ${
                  locale === code ? "bg-red-50 text-red-700 font-medium" : "text-gray-700"
                }`}
              >
                <span className="text-xl">{lang.flag}</span>
                <span>{lang.name}</span>
                {locale === code && <span className="ml-auto text-red-600">{"\u2713"}</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
