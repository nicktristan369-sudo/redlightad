"use client"
import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import DashboardLayout from "@/components/DashboardLayout"
import Link from "next/link"

function DashboardContent() {
  const searchParams = useSearchParams()
  const upgraded = searchParams.get("upgraded")
  const tier = searchParams.get("tier")

  return (
    <DashboardLayout>
      <div>
        {/* Success banner */}
        {upgraded && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-5 mb-6 flex items-center gap-3">
            <span className="text-2xl">🎉</span>
            <div>
              <p className="font-semibold text-green-800">Betaling gennemført!</p>
              <p className="text-green-600 text-sm">Din annonce er opgraderet til {tier?.toUpperCase()} pakken. Gå til Mine annoncer for at se status.</p>
            </div>
          </div>
        )}

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Oversigt</h1>
        <p className="text-gray-500 mb-8">Velkommen til dit dashboard</p>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-8">
          {[
            { label: "Aktive annoncer", value: "0", icon: "📋" },
            { label: "Visninger i dag", value: "0", icon: "👁️" },
            { label: "Nye beskeder", value: "0", icon: "💬" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <span className="text-2xl">{stat.icon}</span>
              <p className="text-3xl font-bold text-gray-900 mt-3">{stat.value}</p>
              <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Hurtige handlinger</h2>
          <div className="flex flex-wrap gap-4">
            <Link href="/opret-annonce" className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-medium text-sm transition-colors">
              ➕ Opret ny annonce
            </Link>
            <Link href="/dashboard/annoncer" className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-medium text-sm transition-colors">
              📋 Se mine annoncer
            </Link>
            <Link href="/premium" className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 px-6 py-3 rounded-xl font-medium text-sm transition-colors">
              👑 Opgrader til Premium
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default function DashboardPage() {
  return <Suspense><DashboardContent /></Suspense>
}
