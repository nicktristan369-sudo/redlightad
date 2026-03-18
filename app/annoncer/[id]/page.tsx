import Navbar from "@/components/Navbar";
import AnnonceDetailClient from "./AnnonceDetailClient";
import SendMessageButton from "@/components/SendMessageButton";
import LockedContentSection from "@/components/LockedContentSection";
import PremiumCarousel from "@/components/PremiumCarousel";
import OpeningHoursDisplay from "@/components/OpeningHoursDisplay";
import ProfileInfoSidebar from "@/components/ProfileInfoSidebar";
import ContactSection from "@/components/ContactSection";
import { mockAnnonceAd } from "@/lib/mockAds";

export default async function AnnonceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // TODO: fetch real ad from supabase by id
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
                voiceMessageUrl={ad.voiceMessageUrl ?? null}
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
              {/* Opening Hours */}
              <OpeningHoursDisplay
                openingHours={(ad as Record<string, unknown>).opening_hours as Parameters<typeof OpeningHoursDisplay>[0]["openingHours"]}
                profileTimezone={(ad as Record<string, unknown>).timezone as string | null}
              />

              {/* Locked Content */}
              <LockedContentSection listingId={id} />
            </div>

            {/* Right column — sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-6">
                {/* Profile Info + Rates — currency-aware */}
                <ProfileInfoSidebar
                  age={ad.age}
                  gender={ad.gender}
                  category={ad.category}
                  city={ad.city}
                  country={ad.country}
                  languages={ad.languages}
                  rates={ad.rates}
                />

                {/* Send Message */}
                <div style={{ background: "#fff", border: "1px solid #E5E5E5", borderRadius: "12px", padding: "24px" }}>
                  <h3 className="mb-4 text-base font-bold text-gray-900">Send Message</h3>
                  <SendMessageButton
                    listingId={String(ad.id)}
                    providerId="00000000-0000-0000-0000-000000000000"
                  />
                </div>

                {/* Contact — locked */}
                <ContactSection contact={{}} />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Premium Members */}
      <PremiumCarousel
        title="Premium Members"
        subtitle="Top verified members"
        excludeId={id}
        bgClass="bg-white border-t border-gray-100"
      />

      <footer className="border-t border-gray-200 bg-white px-6 py-8 text-center text-sm text-gray-500">
        &copy; 2026 RedLightAD. All rights reserved.
      </footer>
    </>
  );
}
