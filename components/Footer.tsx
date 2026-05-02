"use client"
import Link from "next/link"
import { Shield, AlertTriangle, Video, Coins } from "lucide-react"
import { useLanguage } from "@/lib/i18n/LanguageContext"
import Logo from "@/components/Logo"
import { usePathname } from "next/navigation"

export default function Footer() {
  const { t } = useLanguage()
  const pathname = usePathname()

  // Hide footer on dashboard pages and cam stream pages
  const hideOn = ["/dashboard", "/cam/", "/admin", "/p/", "/me/"]
  if (hideOn.some(p => pathname.startsWith(p))) return null

  return (
    <footer className="bg-black text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">

        {/* Logo + tagline */}
        <div className="mb-10">
          <Logo variant="dark" height={28} />
          <p className="text-gray-500 text-sm mt-2">{t.footer_tagline}</p>
        </div>

        {/* 5 columns */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">

          {/* Categories */}
          <div>
            <h3 className="text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-4">Categories</h3>
            <ul className="space-y-2.5">
              {[
                { label: "Escort",       href: "/escort" },
                { label: "Massage",      href: "/massage" },
                { label: "Fetish",       href: "/fetish" },
                { label: "Transgender",  href: "/transgender" },
                { label: "BDSM",         href: "/bdsm" },
                { label: "Pornstar",     href: "/pornstar" },
              ].map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-[13px] text-gray-500 hover:text-white transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Features */}
          <div>
            <h3 className="text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-4">Features</h3>
            <ul className="space-y-2.5">
              <li>
                <Link href="/cam" className="text-[13px] font-semibold flex items-center gap-1.5 hover:text-white transition-colors" style={{ color: "#ef4444" }}>
                  <Video size={12} strokeWidth={2} />
                  <span><span style={{ color: "#ef4444" }}>RED</span><span className="text-white">LIGHT</span><span style={{ color: "#ef4444" }}>CAM</span></span>
                </Link>
              </li>
              <li>
                <Link href="/dashboard/buy-coins" className="text-[13px] flex items-center gap-1.5 text-gray-500 hover:text-white transition-colors">
                  <Coins size={12} strokeWidth={2} />
                  Red Coins
                </Link>
              </li>
              <li>
                <Link href="/premium" className="text-[13px] text-gray-500 hover:text-white transition-colors">
                  Premium
                </Link>
              </li>
              <li>
                <Link href="/reviews" className="text-[13px] text-gray-500 hover:text-white transition-colors">
                  Reviews
                </Link>
              </li>
              <li>
                <Link href="/marketplace" className="text-[13px] text-gray-500 hover:text-white transition-colors">
                  Marketplace
                </Link>
              </li>
              <li>
                <Link href="/videos" className="text-[13px] text-gray-500 hover:text-white transition-colors">
                  Videos
                </Link>
              </li>
              <li>
                <Link href="/onlyfans" className="text-[13px] text-gray-500 hover:text-white transition-colors">
                  OnlyFans
                </Link>
              </li>
            </ul>
          </div>

          {/* Locations */}
          <div>
            <h3 className="text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-4">Locations</h3>
            <ul className="space-y-2.5">
              {[
                { label: "Europe",         href: "/europe" },
                { label: "United Kingdom", href: "/gb" },
                { label: "United States",  href: "/us" },
                { label: "Australia",      href: "/au" },
                { label: "Canada",         href: "/ca" },
                { label: "Asia",           href: "/asia" },
                { label: "Middle East",    href: "/middle-east" },
                { label: "Scandinavia",    href: "/scandinavia" },
              ].map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-[13px] text-gray-500 hover:text-white transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-4">Support</h3>
            <ul className="space-y-2.5">
              {[
                { label: "FAQ",           href: "/faq" },
                { label: "Contact Us",    href: "/contact" },
                { label: "Safety Tips",   href: "/safety" },
                { label: "Terms & Rules", href: "/terms" },
                { label: "Report Abuse",  href: "/report" },
                { label: "Help Center",   href: "/help" },
              ].map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-[13px] text-gray-500 hover:text-white transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-4">Company</h3>
            <ul className="space-y-2.5">
              {[
                { label: "About Us",       href: "/about" },
                { label: "Press",          href: "/press" },
                { label: "Advertise",      href: "/advertise" },
                { label: "Privacy Policy", href: "/privacy" },
                { label: "Cookie Policy",  href: "/cookies" },
              ].map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-[13px] text-gray-500 hover:text-white transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Divider */}
        <div className="border-t border-gray-800" />

        {/* Bottom bar */}
        <div className="pt-6 flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="text-[12px] text-gray-500 text-center md:text-left">
            © 2026 RedLightAd.com — The World&apos;s Premier Adult Advertising Platform. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="flex items-center gap-1.5 text-[12px] text-gray-500 hover:text-gray-300 transition-colors">
              <Shield className="w-3.5 h-3.5" />
              Privacy Policy
            </Link>
            <span className="flex items-center gap-1.5 text-[12px] font-semibold text-gray-300 border border-gray-700 rounded-full px-3 py-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              Adults Only 18+
            </span>
          </div>
        </div>

        {/* Legal disclaimer */}
        <div className="border-t border-gray-800 mt-6 pt-6 text-center space-y-3">
          <p className="text-[11px] text-gray-600 leading-relaxed max-w-4xl mx-auto">
            Copyright © redlightad.com, 2026. By using this site you agree to comply with our terms of use. All profiles listed on this site were 18 years of age or older at the time of listing. This website uses cookies to improve your experience.
          </p>
          <p className="text-[11px] text-gray-600 leading-relaxed max-w-4xl mx-auto">
            All profiles listed on RedLightAd.com charge for their time and companionship only. Anything else that may occur is a matter of coincidence and choice between consenting adults. By using this site you accept that we do not support or advertise sexually based business activities in any form. You hereby declare that you offer your time and companionship only. We do not support any forms of sexual activity based business partnerships — every advertiser must be an independent individual.
          </p>
          <p className="text-[12px] font-semibold text-gray-500 tracking-wide">
            Say NO to human trafficking.
          </p>
        </div>

      </div>
    </footer>
  )
}
