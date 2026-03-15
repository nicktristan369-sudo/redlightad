"use client"

import { useEffect, useState } from "react"
import CountrySelector from "@/components/CountrySelector"
import Logo from "@/components/Logo"

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
    // Show country selector if no country chosen yet
    try {
      if (!localStorage.getItem("selected_country")) setShowCountry(true)
    } catch { /* ignore */ }
  }

  const handleExit = () => {
    window.location.href = "https://www.google.com"
  }

  if (!visible) return showCountry ? <CountrySelector forceOpen onClose={() => setShowCountry(false)} /> : null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.92)" }}>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gray-950 px-8 pt-8 pb-6 text-center">
          <div className="flex justify-center mb-6">
            <Logo variant="dark" height={36} />
          </div>
          <div className="flex items-center justify-center gap-2 mb-3">
            <span className="text-amber-400 text-xl">⚠️</span>
            <h2 className="text-white text-lg font-bold">Adult Content Warning</h2>
          </div>
          <p className="text-gray-400 text-sm leading-relaxed">
            This website contains adult content intended<br />
            for individuals 18 years of age or older.
          </p>
        </div>

        {/* Body */}
        <div className="px-8 py-6">
          <p className="text-sm font-semibold text-gray-700 mb-3">By entering, you confirm that:</p>
          <ul className="space-y-2 mb-7">
            {[
              "You are 18 years of age or older",
              "It is legal to view adult content in your location",
              "You accept our Terms of Service and Privacy Policy",
            ].map(item => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-gray-600">
                <span className="mt-0.5 flex-shrink-0 w-4 h-4 rounded-full bg-gray-900 flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                {item}
              </li>
            ))}
          </ul>

          {/* Buttons */}
          <button
            onClick={handleEnter}
            className="w-full bg-gray-900 hover:bg-black text-white font-bold py-4 rounded-xl text-sm tracking-wide transition-colors mb-3"
          >
            ENTER — I AM 18+
          </button>
          <button
            onClick={handleExit}
            className="w-full text-red-500 hover:text-red-700 text-sm font-medium py-2 transition-colors"
          >
            EXIT
          </button>
        </div>
      </div>
    </div>
  )
}
