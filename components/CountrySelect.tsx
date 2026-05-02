"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { SUPPORTED_COUNTRIES } from "@/lib/countries"
import "flag-icons/css/flag-icons.min.css"

interface Props {
  value: string        // country name
  onChange: (name: string, code: string) => void
  required?: boolean
  placeholder?: string
}

export default function CountrySelect({ value, onChange, required, placeholder = "Select country..." }: Props) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const ref = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const selected = SUPPORTED_COUNTRIES.find(c => c.name === value)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch("")
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 50)
  }, [open])

  const filtered = useMemo(() => {
    if (!search) return SUPPORTED_COUNTRIES
    const q = search.toLowerCase()
    return SUPPORTED_COUNTRIES.filter(c => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q))
  }, [search])

  return (
    <div>
      <label className="block text-[13px] font-medium text-gray-500 uppercase tracking-wide mb-1.5">
        Country{required && <span className="text-red-600 ml-0.5">*</span>}
      </label>
      <div ref={ref} className="relative">
        {/* Trigger */}
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className="w-full flex items-center gap-3 px-4 py-3 border border-gray-200 bg-white text-gray-900 focus:outline-none hover:border-gray-300 transition-colors text-[15px] text-left"
          style={{ borderRadius: 0 }}
        >
          {selected ? (
            <>
              <span
                className={`fi fi-${selected.code.toLowerCase()} fis`}
                style={{ width: 20, height: 20, display: "inline-block", flexShrink: 0, borderRadius: 3 }}
              />
              <span className="flex-1">{selected.name}</span>
            </>
          ) : (
            <span className="flex-1 text-gray-500">{placeholder}</span>
          )}
          <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown */}
        {open && (
          <div className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-200 shadow-2xl flex flex-col max-h-72">
            {/* Search */}
            <div className="p-2 border-b border-gray-100 bg-gray-50">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search country..."
                  className="w-full pl-8 pr-3 py-2 text-sm bg-white border border-gray-200 outline-none focus:border-[#DC2626]"
                  style={{ borderRadius: 0 }}
                />
              </div>
            </div>
            {/* List */}
            <div className="overflow-y-auto flex-1">
              {filtered.map(c => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => { onChange(c.name, c.code); setOpen(false); setSearch("") }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 border-b border-gray-50 transition-colors ${
                    value === c.name ? "bg-red-50 text-[#DC2626] font-medium" : "text-gray-800"
                  }`}
                >
                  <span
                    className={`fi fi-${c.code.toLowerCase()} fis`}
                    style={{ width: 20, height: 20, display: "inline-block", flexShrink: 0, borderRadius: 3 }}
                  />
                  <span className="text-sm flex-1">{c.name}</span>
                  {value === c.name && (
                    <svg className="w-4 h-4 text-[#DC2626] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="text-center text-sm text-gray-500 py-6">No countries found</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
