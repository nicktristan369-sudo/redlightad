"use client"
import Link from "next/link"
import { Shield, AlertTriangle } from "lucide-react"
import { useLanguage } from "@/lib/i18n/LanguageContext"

export default function Footer() {
  const { t } = useLanguage()

  return (
    <footer className="bg-black text-white mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-12">

        {/* Logo + tagline */}
        <div className="mb-10">
          <span className="text-xl font-black tracking-wider" style={{ color: "#8B0000" }}>
            REDLIGHTAD
          </span>
          <p className="text-gray-300 text-sm mt-1">{t.footer_tagline}</p>
        </div>

        {/* 4 columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">

          <div>
            <h3 className="text-xs font-semibold tracking-widest uppercase text-white mb-4">{t.footer_categories}</h3>
            <ul className="space-y-2 text-sm">
              {["Escort", "Massage", "Fetish", "Transgender", "BDSM", "Webcam"].map((cat) => (
                <li key={cat}>
                  <Link href={`/category/${cat.toLowerCase()}`} className="text-sm text-gray-300 hover:text-white transition-colors">
                    {cat}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold tracking-widest uppercase text-white mb-4">{t.footer_locations}</h3>
            <ul className="space-y-2 text-sm">
              {["Europe", "United Kingdom", "United States", "Australia", "Canada", "Asia"].map((loc) => (
                <li key={loc}>
                  <Link href={`/location/${loc.toLowerCase().replace(/ /g, "-")}`} className="text-sm text-gray-300 hover:text-white transition-colors">
                    {loc}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold tracking-widest uppercase text-white mb-4">{t.footer_support}</h3>
            <ul className="space-y-2 text-sm">
              {[
                { label: t.footer_faq, href: "/faq" },
                { label: t.footer_contact, href: "/contact" },
                { label: t.footer_safety, href: "/safety" },
                { label: t.footer_terms, href: "/terms" },
                { label: t.footer_report, href: "/report" },
              ].map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-sm text-gray-300 hover:text-white transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold tracking-widest uppercase text-white mb-4">{t.footer_company}</h3>
            <ul className="space-y-2 text-sm">
              {[
                { label: "🛍 Marketplace", href: "/marketplace" },
                { label: t.footer_about, href: "/about" },
                { label: t.footer_press, href: "/press" },
                { label: t.footer_advertise, href: "/advertise" },
                { label: t.footer_privacy, href: "/privacy" },
                { label: t.footer_cookies, href: "/cookies" },
              ].map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-sm text-gray-300 hover:text-white transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-700 pt-6 flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="text-xs text-gray-300 text-center md:text-left">
            {t.footer_copyright}
          </p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-xs text-gray-300">
              <Shield className="w-3.5 h-3.5" />
              {t.footer_privacy}
            </span>
            <span className="flex items-center gap-1.5 text-xs font-medium text-white border border-gray-600 rounded-full px-3 py-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              Adults Only 18+
            </span>
          </div>
        </div>

        {/* Legal disclaimer */}
        <div className="border-t border-gray-700 mt-6 pt-6 text-center space-y-3">
          <p className="text-xs text-gray-400 leading-relaxed max-w-4xl mx-auto">
            Copyright © redlightad.com, 2026. By using this site you agree to comply with our terms of use. All profiles listed on this site were 18 years of age or older at the time of listing. This website uses cookies to improve your experience.
          </p>
          <p className="text-xs text-gray-400 leading-relaxed max-w-4xl mx-auto">
            All profiles listed on RedLightAd.com charge for their time and companionship only. Anything else that may occur is a matter of coincidence and choice between consenting adults. By using this site you accept that we do not support or advertise sexually based business activities in any form. You hereby declare that you offer your time and companionship only. We do not support any forms of sexual activity based business partnerships — every advertiser must be an independent individual.
          </p>
          <p className="text-xs font-medium text-gray-300">
            🚫 Say NO to human trafficking.
          </p>
        </div>

      </div>
    </footer>
  )
}
