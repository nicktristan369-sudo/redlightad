import Navbar from "@/components/Navbar";
import AnnonceDetailClient from "./AnnonceDetailClient";
import { mockAnnonceAd } from "@/lib/mockAds";

export default async function AnnonceDetailPage() {
  // TODO: fetch from supabase by id
  const ad = mockAnnonceAd;

  return (
    <>
      <Navbar />
      <main className="bg-gray-50 min-h-screen">
        <div className="mx-auto max-w-7xl px-4 py-8">
          {/* Breadcrumb */}
          <nav className="mb-4 flex items-center gap-1 text-sm">
            <a href="/" className="text-gray-500 hover:text-red-600">
              Home
            </a>
            <span className="text-gray-400">/</span>
            <a href="/danmark" className="text-gray-500 hover:text-red-600">
              {ad.country}
            </a>
            <span className="text-gray-400">/</span>
            <a href="/escort" className="text-gray-500 hover:text-red-600">
              {ad.category}
            </a>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900 font-medium">{ad.name}</span>
          </nav>

          {/* Profile Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">{ad.name}</h1>
              {ad.verified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-500 px-2.5 py-0.5 text-xs font-medium text-white">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Verified
                </span>
              )}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-sm text-gray-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Last seen {ad.lastSeen}
            </div>
          </div>

          {/* Two-column layout */}
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Left column */}
            <div className="lg:col-span-2 space-y-6">
              <AnnonceDetailClient
                images={ad.images}
                totalPhotos={ad.totalPhotos}
                hasVoiceMessage={ad.hasVoiceMessage}
              />

              {/* About Me */}
              <div className="rounded-xl bg-white p-6 shadow-md">
                <h3 className="mb-3 text-xl font-bold text-gray-900">Om mig</h3>
                <p className="text-gray-600 leading-relaxed">{ad.about}</p>
              </div>

              {/* Services */}
              <div className="rounded-xl bg-white p-6 shadow-md">
                <h3 className="mb-4 text-xl font-bold text-gray-900">Services</h3>
                <div className="flex flex-wrap gap-2">
                  {ad.services.map((service) => (
                    <span
                      key={service}
                      className="rounded-full bg-gray-100 px-4 py-2 text-sm text-gray-700"
                    >
                      {service}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right column — sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-6">
                {/* Profile Info */}
                <div className="rounded-xl bg-white p-6 shadow-md">
                  <h3 className="mb-4 text-xl font-bold text-gray-900">Profilinfo</h3>
                  <div className="divide-y divide-gray-100">
                    {[
                      { icon: "🎂", label: "Alder", value: ad.age },
                      { icon: "♀️", label: "Køn", value: ad.gender },
                      { icon: "📁", label: "Kategori", value: ad.category },
                      {
                        icon: "📍",
                        label: "Lokation",
                        value: `${ad.city}, ${ad.country}`,
                      },
                      {
                        icon: "🗣️",
                        label: "Sprog",
                        value: ad.languages.join(", "),
                      },
                    ].map((row) => (
                      <div
                        key={row.label}
                        className="flex items-center justify-between py-3"
                      >
                        <span className="flex items-center gap-2 text-sm text-gray-500">
                          <span>{row.icon}</span>
                          {row.label}
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {row.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Rates Table */}
                <div className="rounded-xl bg-white p-6 shadow-md">
                  <h3 className="mb-4 text-xl font-bold text-gray-900">Priser</h3>
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="pb-2 text-left text-xs font-medium uppercase text-gray-500">
                          Varighed
                        </th>
                        <th className="pb-2 text-right text-xs font-medium uppercase text-gray-500">
                          Pris
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {ad.rates.map((rate, i) => (
                        <tr
                          key={rate.duration}
                          className={i % 2 === 0 ? "bg-gray-50" : ""}
                        >
                          <td className="py-2.5 px-2 text-sm text-gray-700 rounded-l-lg">
                            {rate.duration}
                          </td>
                          <td className="py-2.5 px-2 text-right text-sm font-bold text-red-600 rounded-r-lg">
                            {rate.price}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Contact — locked */}
                <div className="relative rounded-xl bg-white p-6 shadow-md overflow-hidden">
                  <h3 className="mb-4 text-xl font-bold text-gray-900">Kontakt</h3>
                  <div className="space-y-3 blur-sm pointer-events-none">
                    <button className="w-full rounded-xl bg-gray-900 py-3 text-sm font-medium text-white">
                      📞 Telefon
                    </button>
                    <button className="w-full rounded-xl bg-[#25D366] py-3 text-sm font-medium text-white">
                      💬 WhatsApp
                    </button>
                    <button className="w-full rounded-xl bg-[#0088cc] py-3 text-sm font-medium text-white">
                      ✈️ Telegram
                    </button>
                    <button className="w-full rounded-xl bg-[#FFFC00] py-3 text-sm font-medium text-gray-900">
                      👻 Snapchat
                    </button>
                    <button className="w-full rounded-xl bg-red-600 py-3 text-sm font-medium text-white">
                      📧 Email
                    </button>
                  </div>

                  {/* Lock overlay */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm rounded-xl">
                    <svg
                      className="w-8 h-8 text-gray-400 mb-2"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <p className="text-sm text-gray-600 mb-3">
                      Log ind for at se kontaktinfo
                    </p>
                    <button className="rounded-xl bg-red-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors cursor-pointer">
                      Log ind
                    </button>
                    <button className="mt-2 text-sm text-gray-500 hover:text-gray-700 cursor-pointer">
                      Opret konto
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-200 bg-white px-6 py-8 text-center text-sm text-gray-500">
        &copy; 2026 RedLightAD. All rights reserved.
      </footer>
    </>
  );
}
