import DashboardLayout from "@/components/DashboardLayout"

export default function BeskederPage() {
  return (
    <DashboardLayout>
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Beskeder</h1>
        <p className="text-gray-500 mb-8">Dine samtaler med brugere</p>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
          <p className="text-5xl mb-4">💬</p>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Ingen beskeder endnu</h2>
          <p className="text-gray-500">Beskeder fra interesserede brugere vises her</p>
        </div>
      </div>
    </DashboardLayout>
  )
}
