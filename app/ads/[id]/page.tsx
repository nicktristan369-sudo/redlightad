"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import Navbar from "@/components/Navbar";
import AdDetailClient from "./AdDetailClient";
import PhotoGallery from "@/components/PhotoGallery";
import VoicePlayer from "@/components/VoicePlayer";
import AdSidebar from "@/components/AdSidebar";
import ContactSection from "@/components/ContactSection";
import MapMeSection from "@/components/MapMeSection";
import VideoSection from "@/components/VideoSection";
import SocialLinksSection from "@/components/SocialLinksSection";
import TravelBox from "@/components/TravelBox";
import type { TravelEntry } from "@/components/TravelBox";
import TravelScheduleSection from "@/components/TravelScheduleSection";
import StickyActionBar from "@/components/StickyActionBar";
import SendMessageBox from "@/components/SendMessageBox";
import ReportModal from "@/components/ReportModal";
import PayMeBox from "@/components/PayMeBox";
import PhotoGrid from "@/components/PhotoGrid";
import PrivateContentPreview from "@/components/PrivateContentPreview";
import ReadMoreText from "@/components/ReadMoreText";
import StoryCircles from "@/components/StoryCircles";

// Dynamic imports for below-the-fold components
const MarketplaceSection = dynamic(() => import("@/components/MarketplaceSection"), { ssr: false });
const LockedContentSection = dynamic(() => import("@/components/LockedContentSection"), { ssr: false });
const ReviewsSection = dynamic(() => import("@/components/ReviewsSection"), { ssr: false });
import { createClient } from "@/lib/supabase";
import type { SocialLinks } from "@/components/SocialLinksSection";
import { useLanguage } from "@/lib/i18n/LanguageContext";

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
  viber?: string | null;
  wechat?: string | null;
  line_app?: string | null;
  signal?: string | null;
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
  body_build?: string | null;
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
  payment_methods?: string[] | null;
  onlyfans_username?: string | null;
  profile_video_url?: string | null;
  incall?: boolean | null;
  outcall?: boolean | null;
  handicap_friendly?: boolean | null;
  has_own_place?: boolean | null;
  opening_hours?: Record<string, { open: string; close: string; closed: boolean }> | null;
  timezone?: string | null;
  // Exact address fields
  show_exact_address?: boolean | null;
  exact_address?: string | null;
  exact_latitude?: number | null;
  exact_longitude?: number | null;
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
  const { t } = useLanguage();

  useEffect(() => {
    const load = async () => {
      try {
        const supabase = createClient();

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUserId(user?.id ?? null);

        // Fetch listing - try by ID first, then by slug
        let data = null;
        
        // Check if id looks like a UUID
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      
      if (isUuid) {
        const result = await supabase
          .from("listings")
          .select("*")
          .eq("id", id)
          .in("status", ["active", "pending"])
          .maybeSingle();
        data = result.data;
      }
      
      // If not found by ID (or not a UUID), try by slug
      if (!data) {
        const result = await supabase
          .from("listings")
          .select("*")
          .eq("slug", id)
          .in("status", ["active", "pending"])
          .maybeSingle();
        data = result.data;
      }

      setAd(data ?? null);

      // Track profile view (fire and forget)
      if (data?.id) {
        const session = await supabase.auth.getSession();
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (session.data.session?.access_token) {
          headers.Authorization = `Bearer ${session.data.session.access_token}`;
        }
        fetch("/api/track/view", {
          method: "POST",
          headers,
          body: JSON.stringify({ listing_id: data.id }),
        }).catch(() => {});
      }

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
      } catch (err) {
        console.error("[Ads] Load error:", err);
        setLoading(false);
      }
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
          <p className="text-[18px] font-semibold text-gray-900">{t.ad_not_found}</p>
          <a href="/" className="text-[14px] text-red-600 hover:underline">{t.ad_back_home}</a>
        </div>
      </>
    );
  }

  const lockedVideos = videos.filter(v => v.is_locked);
  const isOwnListing = currentUserId === ad.user_id;
  const isPremium = !!ad.premium_tier;

  const rates = [
    ad.rate_1hour    && { duration: "1 hour",    price: ad.rate_1hour },
    ad.rate_2hours   && { duration: "2 hours",   price: ad.rate_2hours },
    ad.rate_overnight && { duration: "Overnight",  price: ad.rate_overnight },
    ad.rate_weekend  && { duration: "Weekend",   price: ad.rate_weekend },
  ].filter(Boolean) as { duration: string; price: string }[];

  const hasSocialLinks = ad.social_links && Object.values(ad.social_links).some(v => v?.url);

  return (
    <>
      <Navbar />
      <main className="bg-gray-50 min-h-screen pb-20" style={{ paddingTop: 12 }}>
        {/* Mobile-only: full-width gallery at top */}
        <div className="md:hidden px-3">
          <PhotoGallery images={[...(ad.profile_image ? [ad.profile_image] : []), ...(ad.images ?? [])]} totalPhotos={1 + (ad.images ?? []).length} name={ad.title} isLoggedIn={currentUserId !== null} />
        </div>

        <div className="mx-auto max-w-7xl px-4 pt-3 md:pt-8 pb-8">
          {/* Breadcrumb */}
          {(() => {
            const shortTitle = ad.title.replace(/[\u{1F000}-\u{1FFFF}]/gu, '').trim().slice(0, 28).trim();
            const crumbLabel = shortTitle.length < ad.title.replace(/[\u{1F000}-\u{1FFFF}]/gu, '').trim().length ? shortTitle + '…' : shortTitle;
            return (
              <nav className="mb-3 flex items-center gap-1 text-[12px] text-gray-500">
                <a href="/" className="hover:text-red-600 transition-colors">{t.ad_home}</a>
                <span className="text-red-400">/</span>
                <a href={`/country/${ad.country.toLowerCase()}`} className="hover:text-red-600 transition-colors capitalize">{ad.country}</a>
                <span className="text-red-400">/</span>
                <span className="text-gray-600 truncate max-w-[200px] md:max-w-xs">{crumbLabel}</span>
              </nav>
            );
          })()}

          {/* Stories */}
          <StoryCircles listingId={ad.id} />

          {/* Title — outside grid, max 2/3 width on desktop so sidebar aligns with gallery */}
          <div className="mb-4 w-full lg:max-w-[calc(66.666%-1.5rem)]">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-lg md:text-xl font-bold text-gray-900 leading-snug" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{ad.title}</h1>
              {isPremium && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                  </svg>
                  Premium
                </span>
              )}
              {ad.kyc_status === "verified" && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-600">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                  Verified
                </span>
              )}
            </div>
            {(ad as any).short_id && <span className="text-[11px] text-gray-500 mt-1 block">ID #{(ad as any).short_id}</span>}
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
                <div className="rounded bg-white p-6 shadow-sm overflow-hidden" style={{ border: "1px solid #E5E5E5" }}>
                  <h3 className="mb-3 text-lg font-bold text-gray-900">{t.ad_about_me}</h3>
                  <div className="overflow-hidden">
                    <ReadMoreText text={ad.about} maxChars={300} />
                  </div>
                </div>
              )}

              {/* Services */}
              {ad.services && ad.services.length > 0 && (
                <div className="rounded bg-white p-6 shadow-sm overflow-hidden" style={{ border: "1px solid #E5E5E5" }}>
                  <h3 className="mb-4 text-lg font-bold text-gray-900">{t.ad_services}</h3>
                  <div className="flex flex-wrap gap-2 overflow-hidden">
                    {ad.services.map(s => (
                      <span key={s} className="rounded bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">{s}</span>
                    ))}
                  </div>
                  {/* Incall / Outcall / Has own place */}
                  {(ad.incall || ad.outcall || ad.has_own_place || ad.handicap_friendly) && (
                    <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
                      {ad.incall && <span className="flex items-center gap-1.5 rounded-full bg-green-50 border border-green-200 px-3 py-1 text-xs font-600 text-green-700">✓ Incall</span>}
                      {ad.outcall && <span className="flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-600 text-blue-700">✓ Outcall</span>}
                      {ad.has_own_place && <span className="flex items-center gap-1.5 rounded-full bg-gray-50 border border-gray-200 px-3 py-1 text-xs font-600 text-gray-700">✓ Has own place</span>}
                      {ad.handicap_friendly && <span className="flex items-center gap-1.5 rounded-full bg-purple-50 border border-purple-200 px-3 py-1 text-xs font-600 text-purple-700">♿ Disability friendly</span>}
                    </div>
                  )}
                </div>
              )}

              {/* Social Links */}
              {(hasSocialLinks || ad.onlyfans_username) && (
                <SocialLinksSection
                  listingId={ad.id}
                  socialLinks={(ad.onlyfans_username && !ad.social_links?.onlyfans?.url
                    ? { ...ad.social_links, onlyfans: { url: `https://onlyfans.com/${ad.onlyfans_username}` } }
                    : ad.social_links) as SocialLinks}
                  isPremium={isPremium}
                  isOwnListing={isOwnListing}
                />
              )}

              {/* Public gallery */}
              {(ad.images ?? []).length > 1 && (
                <div>
                  <div style={{ borderTop: "1px solid #E5E7EB", paddingTop: 20, marginBottom: 14 }}>
                    <h2 style={{ fontSize: 16, fontWeight: 600, color: "#111", margin: 0 }}>
                      {t.ad_gallery}{" "}
                      <span style={{ fontSize: 14, fontWeight: 400, color: "#9CA3AF" }}>
                        ({(ad.images ?? []).length} {t.ad_photos})
                      </span>
                    </h2>
                  </div>
                  <PhotoGrid images={[...(ad.profile_image ? [ad.profile_image] : []), ...(ad.images ?? [])]} onImageClick={(i) => setGridLightbox(i)} />
                </div>
              )}

              {/* Private content preview */}
              {((ad.locked_images ?? []).length > 0 || lockedVideos.length > 0) && (
                <div>
                  <div style={{ borderTop: "1px solid #E5E7EB", paddingTop: 20, marginBottom: 14 }}>
                    <h2 style={{ fontSize: 16, fontWeight: 600, color: "#111", margin: 0 }}>
                      {t.ad_private_content}{" "}
                      <span style={{ fontSize: 14, fontWeight: 400, color: "#9CA3AF" }}>
                        ({(ad.locked_images ?? []).length + lockedVideos.length} {t.ad_items})
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

              {/* Eksklusivt indhold (locked_content) */}
              <LockedContentSection listingId={ad.id} />

              {/* Marketplace */}
              <MarketplaceSection listingId={ad.id} isLoggedIn={currentUserId !== null} />

              {/* Reviews */}
              {(ad as any).show_reviews && (
                <ReviewsSection
                  listingId={ad.id}
                  isLoggedIn={currentUserId !== null}
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
                  body_build={(ad as any).body_build}
                />
                {/* Map Me section - only show when exact address is enabled */}
                {ad.show_exact_address && ad.exact_latitude && ad.exact_longitude && (
                  <MapMeSection
                    latitude={ad.exact_latitude}
                    longitude={ad.exact_longitude}
                    profileImage={ad.profile_image ?? ad.images?.[0] ?? null}
                  />
                )}
                <ContactSection contact={{
                  phone: ad.phone,
                  whatsapp: ad.whatsapp,
                  telegram: ad.telegram,
                  snapchat: ad.snapchat,
                  email: ad.email,
                  viber: ad.viber,
                  wechat: ad.wechat,
                  line_app: ad.line_app,
                  signal: ad.signal,
                  profileImage: ad.profile_image,
                  name: ad.title,
                }} />
                {ad.payment_methods && ad.payment_methods.length > 0 && (
                  <PayMeBox
                    listing={ad}
                    providerUserId={ad.user_id}
                  />
                )}
                <SendMessageBox
                  listingId={ad.id}
                  listingTitle={ad.title}
                  profileImage={ad.profile_image ?? ad.images?.[0] ?? null}
                  isLoggedIn={currentUserId !== null}
                  isOwnListing={isOwnListing}
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
          <button onClick={() => setGridLightbox(null)} style={{ position: "absolute", top: 12, right: 12, background: "rgba(0,0,0,0.5)", border: "none", color: "#fff", fontSize: 24, cursor: "pointer", zIndex: 101, width: 44, height: 44, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
          <button onClick={(e) => { e.stopPropagation(); setGridLightbox(i => i !== null ? Math.max(0, i - 1) : null) }} style={{ position: "absolute", left: 8, background: "rgba(0,0,0,0.4)", border: "none", color: "#fff", fontSize: 28, cursor: "pointer", zIndex: 101, width: 44, height: 44, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>‹</button>
          <div style={{ position: "relative" }} onClick={e => e.stopPropagation()}>
            <img
              src={(ad?.images ?? [])[gridLightbox]}
              alt=""
              style={{ maxHeight: "90vh", maxWidth: "90vw", objectFit: "contain", display: "block" }}
            />
            {/* Watermark */}
            <div style={{ position: "absolute", bottom: 12, right: 14, pointerEvents: "none", userSelect: "none", zIndex: 10 }}>
              <span style={{
                fontSize: 13, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase",
                color: "rgba(255,255,255,0.60)",
                textShadow: "1px 1px 3px rgba(0,0,0,0.85), 0 0 8px rgba(0,0,0,0.55)",
                fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
              }}>REDLIGHTAD.COM</span>
            </div>
          </div>
          <button onClick={(e) => { e.stopPropagation(); setGridLightbox(i => i !== null ? Math.min((ad?.images ?? []).length - 1, i + 1) : null) }} style={{ position: "absolute", right: 8, background: "rgba(0,0,0,0.4)", border: "none", color: "#fff", fontSize: 28, cursor: "pointer", zIndex: 101, width: 44, height: 44, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>›</button>
          <div style={{ position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)", color: "#aaa", fontSize: 13 }}>{gridLightbox + 1} / {(ad?.images ?? []).length}</div>
        </div>
      )}

      {/* Report link */}
      <div style={{ textAlign: "center", padding: "16px 0 8px" }}>
        <button
          onClick={() => setReportOpen(true)}
          style={{ fontSize: 12, color: "#9CA3AF", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
        >
          {t.ad_report_profile}
        </button>
      </div>
      <ReportModal
        listingId={ad.id}
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        isLoggedIn={currentUserId !== null}
      />

      <footer className="border-t border-gray-200 bg-white px-6 py-8 text-center text-sm text-gray-500">
        {t.ad_copyright}
      </footer>
    </>
  );
}
