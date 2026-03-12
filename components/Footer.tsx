import Link from "next/link"

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-12">

        {/* Logo + tagline */}
        <div className="mb-10">
          <span className="text-2xl font-bold text-white">
            RED<span className="text-red-500">LIGHT</span>AD
          </span>
          <p className="text-gray-400 text-sm mt-1">The Premier Adult Advertising Platform</p>
        </div>

        {/* 4 columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">

          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Categories</h3>
            <ul className="space-y-2 text-sm">
              {["Escort", "Massage", "Fetish", "Transgender", "BDSM", "Webcam"].map((cat) => (
                <li key={cat}>
                  <Link href={`/category/${cat.toLowerCase()}`} className="hover:text-red-400 transition-colors">
                    {cat}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Locations</h3>
            <ul className="space-y-2 text-sm">
              {["Europe", "United Kingdom", "United States", "Australia", "Canada", "Asia"].map((loc) => (
                <li key={loc}>
                  <Link href={`/location/${loc.toLowerCase().replace(/ /g, "-")}`} className="hover:text-red-400 transition-colors">
                    {loc}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Support</h3>
            <ul className="space-y-2 text-sm">
              {[
                { label: "FAQ", href: "/faq" },
                { label: "Contact Us", href: "/contact" },
                { label: "Safety Tips", href: "/safety" },
                { label: "Terms & Rules", href: "/terms" },
                { label: "Report Abuse", href: "/report" },
              ].map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="hover:text-red-400 transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">Company</h3>
            <ul className="space-y-2 text-sm">
              {[
                { label: "About Us", href: "/about" },
                { label: "Press", href: "/press" },
                { label: "Advertise", href: "/advertise" },
                { label: "Privacy Policy", href: "/privacy" },
                { label: "Cookie Policy", href: "/cookies" },
              ].map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="hover:text-red-400 transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-700 pt-6 flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="text-xs text-gray-500 text-center md:text-left">
            © 2026 RedLightAd.com — The World&apos;s Premier Adult Advertising Platform. All rights reserved.
          </p>
          <span className="text-xs bg-red-900/50 text-red-300 border border-red-800 rounded-full px-3 py-1 font-medium">
            🔞 Adults Only — 18+
          </span>
        </div>

      </div>
    </footer>
  )
}
