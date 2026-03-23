"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function UnlockPage() {
  const [code, setCode] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const res = await fetch("/api/unlock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    })

    setLoading(false)

    if (res.ok) {
      router.push("/")
      router.refresh()
    } else {
      setError("Forkert kode — prøv igen.")
      setCode("")
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <span className="text-2xl font-black tracking-widest text-white uppercase">
            Red<span style={{ color: "#DC2626" }}>Light</span>AD
          </span>
          <p className="text-gray-500 text-sm mt-2">Privat adgang — indtast koden</p>
        </div>

        {/* Card */}
        <form onSubmit={handleSubmit}
          className="bg-gray-900 rounded-2xl p-6 border border-gray-800 shadow-xl">

          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Adgangskode
          </label>

          <input
            type="password"
            value={code}
            onChange={e => setCode(e.target.value)}
            placeholder="••••••••••"
            autoFocus
            required
            className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 text-[15px] outline-none border border-gray-700 focus:border-red-600 transition-colors placeholder-gray-600"
          />

          {error && (
            <p className="text-red-500 text-[13px] mt-2 font-medium">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || code.length === 0}
            className="w-full mt-4 py-3 rounded-xl text-white font-black text-[14px] uppercase tracking-wider transition-opacity disabled:opacity-40"
            style={{ background: "#DC2626" }}>
            {loading ? "Checker..." : "Få adgang"}
          </button>
        </form>
      </div>
    </div>
  )
}
