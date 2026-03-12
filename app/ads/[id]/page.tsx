import Navbar from "@/components/Navbar";
import AdDetailClient from "./AdDetailClient";
import VideoSection from "@/components/VideoSection";
import AdSidebar from "@/components/AdSidebar";
import ContactSection from "@/components/ContactSection";
import { mockAd } from "@/lib/mockAds";

export default async function AdDetailPage() {
  const ad = mockAd;

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
            <span className="text-red-500">/</span>
            <a href={`/country/${ad.country.toLowerCase()}`} className="text-gray-500 hover:text-red-600">
              {ad.country}
            </a>
            <span className="text-red-500">/</span>
            <a href={`/category/${ad.category.toLowerCase()}`} className="text-gray-500 hover:text-red-600">
              {ad.category}
            </a>
            <span className="text-red-500">/</span>
            <span className="text-gray-900 font-medium">{ad.name}</span>
          </nav>

          {/* Profile Name + Verified */}
          <div className="mb-6 flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900">{ad.name}</h1>
            {ad.verified && (
              <span className="rounded-full bg-green-50 px-3 py-1 text-sm font-medium text-green-600">
                ✓ Verified
              </span>
            )}
          </div>

          {/* Two-column layout */}
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Left column */}
            <div className="lg:col-span-2 space-y-6">
              <AdDetailClient
                images={ad.images}
                totalPhotos={ad.totalPhotos}
                name={ad.name}
                hasVoiceMessage={ad.hasVoiceMessage}
              />

              {/* Description */}
              <div className="rounded-xl bg-white p-6 shadow-md">
                <h3 className="mb-3 text-lg font-bold text-gray-900">About</h3>
                <p className="text-sm leading-relaxed text-gray-600">{ad.description}</p>
              </div>

              {/* Video Section */}
              {ad.hasVideo && <VideoSection />}

              {/* Services */}
              <div className="rounded-xl bg-white p-6 shadow-md">
                <h3 className="mb-4 text-lg font-bold text-gray-900">Services</h3>
                <div className="flex flex-wrap gap-2">
                  {ad.services.map((service) => (
                    <span
                      key={service}
                      className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700"
                    >
                      {service}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right column */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-0">
                <AdSidebar
                  age={ad.age}
                  gender={ad.gender}
                  category={ad.category}
                  city={ad.city}
                  country={ad.country}
                  languages={ad.languages}
                  rates={ad.rates}
                />
                <ContactSection contact={ad.contact} />
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
