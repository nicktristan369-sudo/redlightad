"use client"
import Link from "next/link"
import { Shield, AlertTriangle } from "lucide-react"
import { useLanguage } from "@/lib/i18n/LanguageContext"

export default function Footer() {
  const { t } = useLanguage()

  return (
    <footer className="bg-gray-900 text-gray-400 mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-12">

        {/* Logo + tagline */}
        <div className="mb-10">
          <span className="text-xl font-black tracking-wider" style={{ color: "#8B0000" }}>
            REDLIGHTAD
          </span>
          <p className="text-gray-500 text-sm mt-1">{t.footer_tagline}</p>
        </div>

        {/* 4 columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">

          <div>
            <h3 className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-4">{t.footer_categories}</h3>
            <ul className="space-y-2 text-sm">
              {["Escort", "Massage", "Fetish", "Transgender", "BDSM", "Webcam"].map((cat) => (
                <li key={cat}>
                  <Link href={`/category/${cat.toLowerCase()}`} className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                    {cat}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-4">{t.footer_locations}</h3>
            <ul className="space-y-2 text-sm">
              {["Europe", "United Kingdom", "United States", "Australia", "Canada", "Asia"].map((loc) => (
                <li key={loc}>
                  <Link href={`/location/${loc.toLowerCase().replace(/ /g, "-")}`} className="text-sm text-gray-500 hover:text-white transition-colors">
                    {loc}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-4">{t.footer_support}</h3>
            <ul className="space-y-2 text-sm">
              {[
                { label: t.footer_faq, href: "/faq" },
                { label: t.footer_contact, href: "/contact" },
                { label: t.footer_safety, href: "/safety" },
                { label: t.footer_terms, href: "/terms" },
                { label: t.footer_report, href: "/report" },
              ].map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-sm text-gray-500 hover:text-white transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-4">{t.footer_company}</h3>
            <ul className="space-y-2 text-sm">
              {[
                { label: t.footer_about, href: "/about" },
                { label: t.footer_press, href: "/press" },
                { label: t.footer_advertise, href: "/advertise" },
                { label: t.footer_privacy, href: "/privacy" },
                { label: t.footer_cookies, href: "/cookies" },
              ].map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-sm text-gray-500 hover:text-white transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="text-xs text-gray-600 text-center md:text-left">
            {t.footer_copyright}
          </p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-xs text-gray-500">
              <Shield className="w-3.5 h-3.5" />
              {t.footer_privacy}
            </span>
            <span className="flex items-center gap-1.5 text-xs font-medium text-gray-400 border border-gray-700 rounded-full px-3 py-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              Adults Only 18+
            </span>
          </div>
        </div>

      </div>
    </footer>
  )
}
