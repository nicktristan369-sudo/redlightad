"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import AdDetailClient from "./AdDetailClient";
import PhotoGallery from "@/components/PhotoGallery";
import VoicePlayer from "@/components/VoicePlayer";
import AdSidebar from "@/components/AdSidebar";
import ContactSection from "@/components/ContactSection";
import VideoSection from "@/components/VideoSection";
import SocialLinksSection from "@/components/SocialLinksSection";
import TravelBox from "@/components/TravelBox";
import type { TravelEntry } from "@/components/TravelBox";
import TravelScheduleSection from "@/components/TravelScheduleSection";
import StickyActionBar from "@/components/StickyActionBar";
import SendMessageBox from "@/components/SendMessageBox";
import ReportModal from "@/components/ReportModal";
import PhotoGrid from "@/components/PhotoGrid";
import PrivateContentPreview from "@/components/PrivateContentPreview";
import MarketplaceSection from "@/components/MarketplaceSection";
import StoryCircles from "@/components/StoryCircles";
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
  locked_images: string[] | null;
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
  kyc_status?: string | null;
  // Ekstra profilfelter
  height_cm?: number | null;
  weight_kg?: number | null;
  ethnicity?: string | null;
  eye_color?: string | null;
  hair_color?: string | null;
  hair_length?: string | null;
  pubic_hair?: string | null;
  bust_size?: string | null;
  bust_type?: string | null;
  orientation?: string | null;
  smoker?: string | null;
  tattoo?: string | null;
  piercing?: string | null;
  nationality?: string | null;
  available_for?: string | null;
  meeting_with?: string | null;
  travel?: string | null;
}

export default function AdDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [ad, setAd] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [travelEntries, setTravelEntries] = useState<TravelEntry[]>([]);
  const [reportOpen, setReportOpen] = useState(false);
  const [gridLightbox, setGridLightbox] = useState<number | null>(null);
  const [videos, setVideos] = useState<{ id: string; url: string; thumbnail_url: string | null; title: string | null; is_locked: boolean; redcoin_price: number; views: number; likes: number; sort_order: number }[]>([]);

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

      // Trigger travel check
      fetch("/api/travel/check").catch(() => {});

      // Fetch videos
      if (data) {
        const { data: vids } = await supabase
          .from("listing_videos")
          .select("id, url, thumbnail_url, title, is_locked, redcoin_price, views, likes, sort_order")
          .eq("listing_id", data.id)
          .order("sort_order", { ascending: true });
        if (vids) setVideos(vids);
      }

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

  const lockedVideos = videos.filter(v => v.is_locked);
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
      <main className="bg-gray-50 min-h-screen pb-20 md:pb-0" style={{ paddingTop: 12 }}>
        {/* Mobile-only: full-width gallery at top */}
        <div className="md:hidden px-3">
          <PhotoGallery images={ad.images ?? []} totalPhotos={(ad.images ?? []).length} name={ad.title} isLoggedIn={currentUserId !== null} />
        </div>

        <div className="mx-auto max-w-7xl px-4 pt-3 md:pt-8 pb-8">
          {/* Breadcrumb */}
          {(() => {
            const shortTitle = ad.title.replace(/[\u{1F000}-\u{1FFFF}]/gu, '').trim().slice(0, 28).trim();
            const crumbLabel = shortTitle.length < ad.title.replace(/[\u{1F000}-\u{1FFFF}]/gu, '').trim().length ? shortTitle + '…' : shortTitle;
            return (
              <nav className="mb-3 flex items-center gap-1 text-[12px] text-gray-400">
                <a href="/" className="hover:text-red-600 transition-colors">Home</a>
                <span className="text-red-400">/</span>
                <a href={`/country/${ad.country.toLowerCase()}`} className="hover:text-red-600 transition-colors capitalize">{ad.country}</a>
                <span className="text-red-400">/</span>
                <span className="text-gray-600 truncate max-w-[200px] md:max-w-xs">{crumbLabel}</span>
              </nav>
            );
          })()}

          {/* Stories */}
          <StoryCircles listingId={ad.id} />

          {/* Title — udenfor grid, max 2/3 bredde på desktop så sidebar flugter med galleriet */}
          <div className="mb-4 flex items-start gap-3 w-full lg:max-w-[calc(66.666%-1.5rem)]">
            <h1 className="text-lg md:text-xl font-bold text-gray-900 leading-snug" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{ad.title}</h1>
            {isPremium && (
              <span className="flex-shrink-0 rounded bg-yellow-50 border border-yellow-200 px-3 py-1 text-xs font-semibold text-yellow-700 uppercase tracking-wide">
                {ad.premium_tier}
              </span>
            )}
            {ad.kyc_status === "verified" && (
              <span className="flex-shrink-0" style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                background: "#1D4ED8", color: "white",
                fontSize: 10, fontWeight: 700, letterSpacing: "0.8px",
                padding: "3px 8px", textTransform: "uppercase" as const,
              }}>
                ✓ VERIFIED
              </span>
            )}
          </div>

          {/* Two-column layout — sidebar flugter med galleriet */}
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Left */}
            <div className="lg:col-span-2 space-y-6">
              {/* Desktop gallery + voice */}
              <div className="hidden md:block">
                <AdDetailClient
                  images={ad.images ?? []}
                  totalPhotos={(ad.images ?? []).length}
                  name={ad.title}
                  hasVoiceMessage={!!ad.voice_message_url}
                  isLoggedIn={currentUserId !== null}
                />
              </div>
              {/* Videos — desktop */}
              {videos.length > 0 && (
                <div className="hidden md:block">
                  <VideoSection videos={videos} isLoggedIn={currentUserId !== null} listingId={ad.id} currentUserId={currentUserId} />
                </div>
              )}
              {/* Videos — mobile */}
              {videos.length > 0 && (
                <div className="md:hidden">
                  <VideoSection videos={videos} isLoggedIn={currentUserId !== null} listingId={ad.id} currentUserId={currentUserId} />
                </div>
              )}

              {/* Mobile voice player */}
              {ad.voice_message_url && (
                <div className="md:hidden">
                  <VoicePlayer />
                </div>
              )}

              {/* About */}
              {ad.show_travel_schedule && travelEntries.length > 0 && (
                <TravelBox entries={travelEntries} />
              )}

              <TravelScheduleSection listingId={ad.id} />

              {ad.about && (
                <div className="rounded bg-white p-6 shadow-sm" style={{ border: "1px solid #E5E5E5" }}>
                  <h3 className="mb-3 text-lg font-bold text-gray-900">About me</h3>
                  <p className="text-sm leading-relaxed text-gray-600 whitespace-pre-wrap">{ad.about}</p>
                </div>
              )}

              {/* Services */}
              {ad.services && ad.services.length > 0 && (
                <div className="rounded bg-white p-6 shadow-sm" style={{ border: "1px solid #E5E5E5" }}>
                  <h3 className="mb-4 text-lg font-bold text-gray-900">Services</h3>
                  <div className="flex flex-wrap gap-2">
                    {ad.services.map(s => (
                      <span key={s} className="rounded bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">{s}</span>
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

              {/* Public gallery */}
              {(ad.images ?? []).length > 1 && (
                <div>
                  <div style={{ borderTop: "1px solid #E5E7EB", paddingTop: 20, marginBottom: 14 }}>
                    <h2 style={{ fontSize: 16, fontWeight: 600, color: "#111", margin: 0 }}>
                      Gallery{" "}
                      <span style={{ fontSize: 14, fontWeight: 400, color: "#9CA3AF" }}>
                        ({(ad.images ?? []).length} photos)
                      </span>
                    </h2>
                  </div>
                  <PhotoGrid images={ad.images ?? []} onImageClick={(i) => setGridLightbox(i)} />
                </div>
              )}

              {/* Private content preview */}
              {((ad.locked_images ?? []).length > 0 || lockedVideos.length > 0) && (
                <div>
                  <div style={{ borderTop: "1px solid #E5E7EB", paddingTop: 20, marginBottom: 14 }}>
                    <h2 style={{ fontSize: 16, fontWeight: 600, color: "#111", margin: 0 }}>
                      Private Content{" "}
                      <span style={{ fontSize: 14, fontWeight: 400, color: "#9CA3AF" }}>
                        ({(ad.locked_images ?? []).length + lockedVideos.length} items)
                      </span>
                    </h2>
                  </div>
                  <PrivateContentPreview
                    lockedImages={ad.locked_images ?? []}
                    lockedVideos={lockedVideos.filter(v => v.is_locked)}
                    isLoggedIn={currentUserId !== null}
                    listingId={ad.id}
                  />
                </div>
              )}

              {/* Marketplace */}
              <MarketplaceSection listingId={ad.id} isLoggedIn={currentUserId !== null} />
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
                  listingId={ad.id}
                  height_cm={ad.height_cm}
                  weight_kg={ad.weight_kg}
                  ethnicity={ad.ethnicity}
                  eye_color={ad.eye_color}
                  hair_color={ad.hair_color}
                  hair_length={ad.hair_length}
                  pubic_hair={ad.pubic_hair}
                  bust_size={ad.bust_size}
                  bust_type={ad.bust_type}
                  orientation={ad.orientation}
                  smoker={ad.smoker}
                  tattoo={ad.tattoo}
                  piercing={ad.piercing}
                  nationality={ad.nationality}
                  available_for={ad.available_for}
                  meeting_with={ad.meeting_with}
                  travel={ad.travel}
                />
                <ContactSection contact={{
                  phone: ad.phone,
                  whatsapp: ad.whatsapp,
                  telegram: ad.telegram,
                  snapchat: ad.snapchat,
                  email: ad.email,
                  profileImage: ad.profile_image,
                  name: ad.title,
                }} />
                <SendMessageBox
                  listingId={ad.id}
                  listingTitle={ad.title}
                  profileImage={ad.profile_image ?? ad.images?.[0] ?? null}
                  isLoggedIn={currentUserId !== null}
                />
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
        isLoggedIn={currentUserId !== null}
        profileImage={ad.images?.[0] ?? null}
        name={ad.title}
      />

      {/* Grid lightbox */}
      {gridLightbox !== null && (
        <div
          onClick={() => setGridLightbox(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <button onClick={() => setGridLightbox(null)} style={{ position: "absolute", top: 16, right: 20, background: "none", border: "none", color: "#fff", fontSize: 28, cursor: "pointer", zIndex: 101 }}>✕</button>
          <button onClick={(e) => { e.stopPropagation(); setGridLightbox(i => i !== null ? Math.max(0, i - 1) : null) }} style={{ position: "absolute", left: 16, background: "none", border: "none", color: "#fff", fontSize: 32, cursor: "pointer", zIndex: 101 }}>‹</button>
          <div style={{ position: "relative" }} onClick={e => e.stopPropagation()}>
            <img
              src={(ad?.images ?? [])[gridLightbox]}
              alt=""
              style={{ maxHeight: "90vh", maxWidth: "90vw", objectFit: "contain", display: "block" }}
            />
            {/* Vandmærke */}
            <div style={{ position: "absolute", bottom: 12, right: 14, pointerEvents: "none", userSelect: "none", zIndex: 10 }}>
              <span style={{
                fontSize: 13, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase",
                color: "rgba(255,255,255,0.60)",
                textShadow: "1px 1px 3px rgba(0,0,0,0.85), 0 0 8px rgba(0,0,0,0.55)",
                fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
              }}>REDLIGHTAD.COM</span>
            </div>
          </div>
          <button onClick={(e) => { e.stopPropagation(); setGridLightbox(i => i !== null ? Math.min((ad?.images ?? []).length - 1, i + 1) : null) }} style={{ position: "absolute", right: 16, background: "none", border: "none", color: "#fff", fontSize: 32, cursor: "pointer", zIndex: 101 }}>›</button>
          <div style={{ position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)", color: "#aaa", fontSize: 13 }}>{gridLightbox + 1} / {(ad?.images ?? []).length}</div>
        </div>
      )}

      {/* Report link */}
      <div style={{ textAlign: "center", padding: "16px 0 8px" }}>
        <button
          onClick={() => setReportOpen(true)}
          style={{ fontSize: 12, color: "#9CA3AF", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
        >
          ⚑ Report Profile
        </button>
      </div>
      <ReportModal
        listingId={ad.id}
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        isLoggedIn={currentUserId !== null}
      />

      <footer className="border-t border-gray-200 bg-white px-6 py-8 text-center text-sm text-gray-500">
        &copy; 2026 RedLightAD. All rights reserved.
      </footer>
    </>
  );
}
