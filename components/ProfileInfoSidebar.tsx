"use client"

import { Calendar, User, Tag, MapPin, Globe } from "lucide-react"
import { useCurrency } from "@/lib/useCurrency"
import { convertPrice } from "@/lib/currency"
import { formatLocation } from "@/lib/getRegionForCity"

interface Rate {
  duration: string
  price: string // e.g. "$500"
}

interface ProfileInfoSidebarProps {
  age: number | string
  gender: string
  category: string
  city?: string | null
  country?: string | null
  languages: string[]
  rates: Rate[]
}

// Parse USD amount from price string like "$500" or "500"
function parseUSD(price: string): number {
  const num = parseFloat(price.replace(/[^0-9.]/g, ""))
  return isNaN(num) ? 0 : num
}

export default function ProfileInfoSidebar({
  age, gender, category, city, country, languages, rates,
}: ProfileInfoSidebarProps) {
  const currency = useCurrency()

  const infoRows = [
    { icon: <Calendar size={14} />, label: "Alder",    value: age ? `${age} år` : "—" },
    { icon: <User size={14} />,     label: "Køn",      value: gender || "—" },
    { icon: <Tag size={14} />,      label: "Kategori", value: category || "—" },
    { icon: <MapPin size={14} />,   label: "Lokation", value: formatLocation(city, country) || "—" },
    { icon: <Globe size={14} />,    label: "Sprog",    value: languages?.join(", ") || "—" },
  ]

  return (
    <>
      {/* Profile Info */}
      <div className="rounded bg-white p-6 shadow-sm border border-gray-100">
        <h3 className="mb-4 text-base font-bold text-gray-900">Profilinfo</h3>
        <div className="space-y-0">
          {infoRows.map((row, i) => (
            <div
              key={row.label}
              className="flex items-center justify-between py-2.5"
              style={{ borderBottom: i < infoRows.length - 1 ? "1px solid #F3F4F6" : "none" }}
            >
              <span className="flex items-center gap-2">
                <span style={{ color: "#9CA3AF" }}>{row.icon}</span>
                <span
                  className="uppercase font-semibold tracking-wider"
                  style={{ fontSize: "11px", color: "#6B7280" }}
                >
                  {row.label}
                </span>
              </span>
              <span className="text-[14px] font-medium text-gray-900 text-right max-w-[55%] truncate">
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Rates */}
      {rates && rates.length > 0 && (
        <div className="rounded bg-white p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-gray-900">Priser</h3>
            <span className="text-[11px] text-gray-500">{currency.code}</span>
          </div>
          <div className="space-y-0">
            {rates.map((rate, i) => {
              const usd = parseUSD(rate.price)
              const display = usd > 0 ? convertPrice(usd, currency) : rate.price
              return (
                <div
                  key={rate.duration}
                  className="flex items-center justify-between py-2.5"
                  style={{ borderBottom: i < rates.length - 1 ? "1px solid #F3F4F6" : "none" }}
                >
                  <span className="text-sm text-gray-600">{rate.duration}</span>
                  <span className="text-sm font-bold text-gray-900">{display}</span>
                </div>
              )
            })}
          </div>
          <p className="mt-3 text-[11px] text-gray-500">
            *Prices shown in {currency.code} based on your location
          </p>
        </div>
      )}
    </>
  )
}
