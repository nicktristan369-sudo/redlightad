"use client"

import { useEffect, useState } from "react"
import CountrySelector from "@/components/CountrySelector"
import Link from "next/link"

export default function AgeVerificationModal() {
  const [visible, setVisible] = useState(false)
  const [showCountry, setShowCountry] = useState(false)

  useEffect(() => {
    try {
      const verified = localStorage.getItem("age_verified")
      if (!verified) setVisible(true)
    } catch {
      setVisible(true)
    }
  }, [])

  const handleEnter = () => {
    try { localStorage.setItem("age_verified", "true") } catch { /* ignore */ }
    setVisible(false)
    try {
      if (!localStorage.getItem("selected_country")) setShowCountry(true)
    } catch { /* ignore */ }
  }

  const handleExit = () => {
    window.location.href = "https://www.google.com"
  }

  if (!visible) return showCountry ? <CountrySelector forceOpen onClose={() => setShowCountry(false)} /> : null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black">
      {/* Content container with background image */}
      <div className="relative w-full max-w-2xl mx-4">
        {/* Centered background image behind text - contained within the content box */}
        <div 
          className="absolute inset-0 -inset-x-20 -inset-y-32 bg-contain bg-center bg-no-repeat opacity-20 pointer-events-none"
          style={{ 
            backgroundImage: "url('/age-verify-bg.jpg')",
          }}
        />

        {/* Content */}
        <div className="relative z-10 px-4 py-8">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <span style={{ fontSize: 42, fontWeight: 900, letterSpacing: "-0.02em" }}>
              <span style={{ color: "#DC2626" }}>RED</span>
              <span style={{ color: "#fff" }}>LIGHTAD</span>
            </span>
          </div>

          {/* Main heading */}
          <h1 className="text-white text-center text-3xl md:text-4xl font-bold mb-6">
            This is an adult website
          </h1>

          {/* Notice box */}
          <div className="flex justify-center mb-6">
            <span className="inline-block px-5 py-2 border border-white/30 text-white text-sm font-medium">
              Notice to Users
            </span>
          </div>

          {/* Description */}
          <p className="text-gray-400 text-center text-sm md:text-base leading-relaxed mb-6 max-w-xl mx-auto">
            This website contains age-restricted materials including nudity and explicit 
            depictions of sexual activity. By entering, you affirm that you are at least 18 years of 
            age or the age of majority in the jurisdiction you are accessing the website from and 
            you consent to viewing sexually explicit content.
          </p>

          {/* Notice to Law Enforcement */}
          <div className="text-center mb-8">
            <Link href="/legal/law-enforcement" className="text-red-500 hover:text-red-400 text-sm font-medium">
              Notice to Law Enforcement
            </Link>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto mb-8">
            <button
              onClick={handleEnter}
              className="flex-1 py-4 px-8 border-2 border-white/80 text-white font-bold text-sm hover:bg-white hover:text-black transition-all"
            >
              I am 18 or older - Enter
            </button>
            <button
              onClick={handleExit}
              className="flex-1 py-4 px-8 border-2 border-red-500 text-red-500 font-bold text-sm hover:bg-red-500 hover:text-white transition-all"
            >
              I am under 18 - Exit
            </button>
          </div>

          {/* Parental controls & Terms */}
          <p className="text-gray-500 text-center text-sm mb-2">
            Our{" "}
            <Link href="/parental-controls" className="text-red-500 hover:text-red-400">
              parental controls page
            </Link>
            {" "}explains how you can easily<br />
            block access to this site.
          </p>
          <p className="text-center mb-8">
            <Link href="/terms" className="text-red-500 hover:text-red-400 text-sm font-medium">
              Terms of Service
            </Link>
          </p>

          {/* Footer with RTA */}
          <div className="flex items-center justify-center gap-3 text-gray-500 text-sm">
            <span>© RedLightAD.com, {new Date().getFullYear()}</span>
            <span className="text-gray-600">|</span>
            <a 
              href="https://www.rtalabel.org" 
              target="_blank" 
              rel="noopener noreferrer"
              aria-label="RTA Label - Restricted to Adults"
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              {/* RTA Logo */}
              <svg width="40" height="20" viewBox="0 0 80 40" fill="none">
                <rect x="1" y="1" width="78" height="38" stroke="white" strokeWidth="2" fill="none"/>
                <text x="40" y="26" textAnchor="middle" fill="white" fontSize="18" fontWeight="bold" fontFamily="Arial, sans-serif">RTA</text>
                <text x="68" y="16" fill="white" fontSize="8" fontFamily="Arial, sans-serif">®</text>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
