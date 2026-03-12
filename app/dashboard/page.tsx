import DashboardLayout from "@/components/DashboardLayout"

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Oversigt</h1>
        <p className="text-gray-500 mb-8">Velkommen til dit dashboard</p>

        {/* Stats grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            { label: "Aktive annoncer", value: "0", icon: "📋", color: "blue" },
            { label: "Visninger i dag", value: "0", icon: "👁️", color: "green" },
            { label: "Nye beskeder", value: "0", icon: "💬", color: "red" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl">{stat.icon}</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Hurtige handlinger</h2>
          <div className="flex gap-4">
            <a
              href="/opret-annonce"
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-medium text-sm transition-colors"
            >
              ➕ Opret ny annonce
            </a>
            <a
              href="/dashboard/annoncer"
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-medium text-sm transition-colors"
            >
              📋 Se mine annoncer
            </a>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
