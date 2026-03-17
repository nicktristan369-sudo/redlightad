"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import AdDetailClient from "./AdDetailClient";
import AdSidebar from "@/components/AdSidebar";
import ContactSection from "@/components/ContactSection";
import SocialLinksSection from "@/components/SocialLinksSection";
import TravelBox from "@/components/TravelBox";
import type { TravelEntry } from "@/components/TravelBox";
import StickyActionBar from "@/components/StickyActionBar";
import { createClient } from "@/lib/supabase";
import type { SocialLinks } from "@/components/SocialLinksSection";

interface Listing {
  id: string;
  user_id: string;
  title: string;
  about: string | null;
  category: string;
  gender: string;
  age: number;
  country: string;
  region: string | null;
  city: string | null;
  images: string[] | null;
  profile_image: string | null;
  services: string[] | null;
  languages: string[] | null;
  rate_1hour: string | null;
  rate_2hours: string | null;
  rate_overnight: string | null;
  rate_weekend: string | null;
  phone: string | null;
  whatsapp: string | null;
  telegram: string | null;
  snapchat: string | null;
  email: string | null;
  voice_message_url: string | null;
  video_url: string | null;
  premium_tier: string | null;
  social_links: SocialLinks | null;
  show_travel_schedule: boolean | null;
  status: string;
}

export default function AdDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [ad, setAd] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [travelEntries, setTravelEntries] = useState<TravelEntry[]>([]);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id ?? null);

      // Fetch listing
      const { data } = await supabase
        .from("listings")
        .select("*")
        .eq("id", id)
        .eq("status", "active")
        .single();

      setAd(data ?? null);

      // Fetch travel entries if show_travel_schedule is enabled
      if (data?.show_travel_schedule) {
        fetch(`/api/listings/${id}/travel`)
          .then(r => r.json())
          .then(d => { if (d.entries) setTravelEntries(d.entries); })
          .catch(() => {});
      }

      setLoading(false);
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </>
    );
  }

  if (!ad) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-3">
          <p className="text-[18px] font-semibold text-gray-900">Annonce ikke fundet</p>
          <a href="/" className="text-[14px] text-red-600 hover:underline">← Tilbage til forsiden</a>
        </div>
      </>
    );
  }

  const isOwnListing = currentUserId === ad.user_id;
  const isPremium = !!ad.premium_tier;

  const rates = [
    ad.rate_1hour    && { duration: "1 time",    price: ad.rate_1hour },
    ad.rate_2hours   && { duration: "2 timer",   price: ad.rate_2hours },
    ad.rate_overnight && { duration: "Overnat",  price: ad.rate_overnight },
    ad.rate_weekend  && { duration: "Weekend",   price: ad.rate_weekend },
  ].filter(Boolean) as { duration: string; price: string }[];

  const hasSocialLinks = ad.social_links && Object.values(ad.social_links).some(v => v?.url);

  return (
    <>
      <Navbar />
      <main className="bg-gray-50 min-h-screen pb-20 md:pb-0">
        <div className="mx-auto max-w-7xl px-4 py-8">
          {/* Breadcrumb */}
          <nav className="mb-4 flex items-center gap-1 text-sm">
            <a href="/" className="text-gray-500 hover:text-red-600">Home</a>
            <span className="text-red-500">/</span>
            <a href={`/country/${ad.country.toLowerCase()}`} className="text-gray-500 hover:text-red-600">{ad.country}</a>
            <span className="text-red-500">/</span>
            <span className="text-gray-900 font-medium">{ad.title}</span>
          </nav>

          {/* Title */}
          <div className="mb-6 flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900">{ad.title}</h1>
            {isPremium && (
              <span className="rounded-full bg-yellow-50 border border-yellow-200 px-3 py-1 text-xs font-semibold text-yellow-700 uppercase tracking-wide">
                {ad.premium_tier}
              </span>
            )}
          </div>

          {/* Two-column layout */}
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Left */}
            <div className="lg:col-span-2 space-y-6">
              <AdDetailClient
                images={ad.images ?? []}
                totalPhotos={(ad.images ?? []).length}
                name={ad.title}
                hasVoiceMessage={!!ad.voice_message_url}
                isLoggedIn={currentUserId !== null}
              />

              {/* About */}
              {ad.show_travel_schedule && travelEntries.length > 0 && (
                <TravelBox entries={travelEntries} />
              )}

              {ad.about && (
                <div className="rounded-xl bg-white p-6 shadow-sm" style={{ border: "1px solid #E5E5E5" }}>
                  <h3 className="mb-3 text-lg font-bold text-gray-900">Om mig</h3>
                  <p className="text-sm leading-relaxed text-gray-600 whitespace-pre-wrap">{ad.about}</p>
                </div>
              )}

              {/* Services */}
              {ad.services && ad.services.length > 0 && (
                <div className="rounded-xl bg-white p-6 shadow-sm" style={{ border: "1px solid #E5E5E5" }}>
                  <h3 className="mb-4 text-lg font-bold text-gray-900">Services</h3>
                  <div className="flex flex-wrap gap-2">
                    {ad.services.map(s => (
                      <span key={s} className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Social Links */}
              {hasSocialLinks && (
                <SocialLinksSection
                  listingId={ad.id}
                  socialLinks={ad.social_links!}
                  isPremium={isPremium}
                  isOwnListing={isOwnListing}
                />
              )}
            </div>

            {/* Right sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-4">
                <AdSidebar
                  age={ad.age}
                  gender={ad.gender}
                  category={ad.category}
                  city={ad.city ?? ""}
                  country={ad.country}
                  languages={ad.languages ?? []}
                  rates={rates}
                />
                <ContactSection contact={{
                  phone: ad.phone,
                  whatsapp: ad.whatsapp,
                  telegram: ad.telegram,
                  snapchat: ad.snapchat,
                  email: ad.email,
                }} />
              </div>
            </div>
          </div>
        </div>
      </main>

      <StickyActionBar
        phone={ad.phone}
        whatsapp={ad.whatsapp}
        listingId={ad.id}
        listingTitle={ad.title}
      />

      <footer className="border-t border-gray-200 bg-white px-6 py-8 text-center text-sm text-gray-500">
        &copy; 2026 RedLightAD. All rights reserved.
      </footer>
    </>
  );
}
