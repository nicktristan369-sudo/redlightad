"use client"

import { useState, useRef, useEffect } from "react"
import { useLanguage } from "@/lib/i18n/LanguageContext"
import { ChevronDown, Globe } from "lucide-react"

export default function LanguageSelector() {
  const { locale, setLocale, languages } = useLanguage()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  const current = languages[locale]

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
      >
        <Globe size={12} className="text-gray-400 flex-shrink-0" />
        <span className={`fi fi-${current.flagCode}`} style={{ width: "16px", height: "12px", display: "inline-block" }} />
        <span className="hidden sm:inline">{current.name}</span>
        <ChevronDown size={12} className="text-gray-400" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden py-1">
          {(Object.entries(languages) as [string, { name: string; flagCode: string }][]).map(([code, lang]) => (
            <button
              key={code}
              onClick={() => { setLocale(code as typeof locale); setOpen(false) }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors text-left ${
                code === locale ? "bg-gray-50 font-semibold text-gray-900" : "text-gray-700"
              }`}
            >
              <span className={`fi fi-${lang.flagCode} flex-shrink-0`} style={{ width: "18px", height: "13px", display: "inline-block" }} />
              <span>{lang.name}</span>
              {code === locale && <svg className="ml-auto w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
