"use client"

import { useState } from "react"
import { Lock } from "lucide-react"
import Link from "next/link"

function DarkButton({ children, href }: { children: React.ReactNode; href?: string }) {
  const [hov, setHov] = useState(false)
  const style = {
    background: hov ? "#CC0000" : "#000",
    border: `1px solid ${hov ? "#CC0000" : "#000"}`,
    borderRadius: "8px",
    transition: "all 0.2s",
  }
  if (href) return (
    <Link href={href} className="block w-full py-2.5 text-sm font-semibold text-white text-center" style={style}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      {children}
    </Link>
  )
  return (
    <button className="w-full py-2.5 text-sm font-semibold text-white cursor-pointer" style={style}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      {children}
    </button>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function ContactSection(_props?: any) {
  return (
    <>
      {/* Contact — locked */}
      <div className="relative overflow-hidden" style={{ background: "#fff", border: "1px solid #E5E5E5", borderRadius: "12px", padding: "24px" }}>
        <h3 className="text-base font-bold text-gray-900 mb-4">Contact Info</h3>

        {/* Blurred contact rows */}
        <div className="space-y-2.5 pointer-events-none select-none" style={{ filter: "blur(6px)", opacity: 0.3 }}>
          {["Phone", "WhatsApp", "Telegram", "Snapchat", "Email"].map(c => (
            <div key={c} className="flex items-center gap-3 rounded-lg bg-gray-50 px-4 py-2.5">
              <div className="w-2 h-2 rounded-full bg-gray-400" />
              <span className="text-sm text-gray-700">{c}</span>
              <span className="ml-auto text-sm text-gray-400">••••••••</span>
            </div>
          ))}
        </div>

        {/* Lock overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ borderRadius: "12px", background: "rgba(255,255,255,0.88)", backdropFilter: "blur(2px)" }}>
          <Lock size={18} color="#000" className="mb-2" />
          <p className="text-sm mb-4" style={{ color: "#6B7280" }}>Log in to view contact info</p>
          <div className="w-full px-6 space-y-2">
            <DarkButton href="/login">Log In</DarkButton>
            <Link href="/register" className="block text-center text-[12px] mt-1 hover:underline" style={{ color: "#9CA3AF" }}>
              Create account
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
