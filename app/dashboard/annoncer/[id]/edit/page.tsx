"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import DashboardLayout from "@/components/DashboardLayout";
import LocationSelector from "@/components/LocationSelector";
import VoiceRecorder from "@/components/VoiceRecorder";
import SocialLinksEditor from "@/components/SocialLinksEditor";
import PhoneInput from "@/components/PhoneInput";
import type { SocialLinks } from "@/components/SocialLinksSection";
import { Crown, CheckCircle, AlertTriangle, Plus, Trash2, Eye, EyeOff } from "lucide-react";
import LocationSwitchPanel from "@/components/LocationSwitchPanel";
import type { TravelEntry } from "@/components/TravelBox";
import { CATEGORIES } from "@/lib/constants/categories";
import { SUPPORTED_COUNTRIES } from "@/lib/countries";
const SUPPORTED_COUNTRIES_SORTED = [...SUPPORTED_COUNTRIES].sort((a, b) => a.name.localeCompare(b.name));
import { GENDERS } from "@/lib/constants/genders";
import {
  BODY_BUILD_OPTIONS, HAIR_COLOR_OPTIONS, HAIR_LENGTH_OPTIONS, EYE_COLOR_OPTIONS,
  GROOMING_OPTIONS, BRA_SIZE_OPTIONS, BUST_TYPE_OPTIONS, NATIONALITY_OPTIONS,
  ETHNICITY_OPTIONS, ORIENTATION_OPTIONS, SMOKER_OPTIONS, TATTOO_OPTIONS,
  PIERCING_OPTIONS, TRAVEL_OPTIONS, AVAILABLE_FOR_OPTIONS, MEETING_WITH_OPTIONS,
} from "@/lib/listingOptions";

const DAYS_OF_WEEK = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"] as const;
type DayKey = typeof DAYS_OF_WEEK[number];
const DAY_LABELS: Record<DayKey, string> = { monday:"Monday", tuesday:"Tuesday", wednesday:"Wednesday", thursday:"Thursday", friday:"Friday", saturday:"Saturday", sunday:"Sunday" };
const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2); const m = i % 2 === 0 ? "00" : "30";
  return `${String(h).padStart(2, "0")}:${m}`;
});
const TIMEZONE_OPTIONS = [
  { group: "Europe", zones: ["Europe/Copenhagen","Europe/London","Europe/Paris","Europe/Berlin","Europe/Amsterdam","Europe/Oslo","Europe/Stockholm","Europe/Madrid","Europe/Rome","Europe/Athens","Europe/Warsaw","Europe/Helsinki","Europe/Zurich"] },
  { group: "Americas", zones: ["America/New_York","America/Chicago","America/Los_Angeles","America/Toronto","America/Sao_Paulo"] },
  { group: "Asia", zones: ["Asia/Dubai","Asia/Bangkok","Asia/Tokyo","Asia/Singapore","Asia/Hong_Kong"] },
  { group: "Pacific", zones: ["Pacific/Auckland","Pacific/Sydney"] },
];

interface DayHours { open: string; close: string; closed: boolean; }
type OpeningHours = Record<DayKey, DayHours>;
const defaultHours = (): OpeningHours => {
  const d: Partial<OpeningHours> = {};
  DAYS_OF_WEEK.forEach(day => { d[day] = { open: "09:00", close: "22:00", closed: day === "sunday" }; });
  return d as OpeningHours;
};

const SERVICE_OPTIONS = ["Dinner dates","Social events","Travel companion","Private meetings","Weekend getaways"];
const LANGUAGE_OPTIONS = ["Dansk","Engelsk","Tysk","Fransk","Spansk"];

const TIER_INFO: Record<string, { label: string; color: string; bg: string; features: string[] }> = {
  vip:      { label: "VIP", color: "#92400E", bg: "#FEF3C7", features: ["Voice message","Social links with lock","Highlighted in search (top placement)","VIP badge"] },
  featured: { label: "Featured", color: "#1E40AF", bg: "#EFF6FF", features: ["Voice message","Social links with lock","Featured badge"] },
  basic:    { label: "Basic", color: "#374151", bg: "#F3F4F6", features: ["Voice message","Social links (free)","Basic badge"] },
};

export default function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [step, setStep] = useState(1); // Keep for internal logic but hide UI
  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [notFound, setNotFound] = useState(false);

  // user / tier
  const [userId, setUserId] = useState<string | null>(null);
  const [userTier, setUserTier] = useState<string | null>(null);  // from profiles.subscription_tier OR listing.premium_tier
  const [listingTier, setListingTier] = useState<string | null>(null);

  // images
  const [existingImages, setExistingImages] = useState<string[]>([]);  // already-uploaded URLs
  const [removedImages, setRemovedImages] = useState<string[]>([]);    // to remove
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);

  // videos
  const [existingVideos, setExistingVideos] = useState<{ id: string; url: string; thumbnail_url: string | null; is_locked: boolean; title: string | null; redcoin_price: number }[]>([]);
  const [newVideoFiles, setNewVideoFiles] = useState<File[]>([]);
  const [newVideoLocked, setNewVideoLocked] = useState<boolean[]>([]);
  const [newVideoTitles, setNewVideoTitles] = useState<string[]>([]);
  const [newVideoPrices, setNewVideoPrices] = useState<number[]>([]);
  const [videoUploading, setVideoUploading] = useState(false);
  const [profileVideoUrl, setProfileVideoUrl] = useState<string | null>(null);

  // voice + social
  const [voiceMessageUrl, setVoiceMessageUrl] = useState<string>("");
  const [socialLinks, setSocialLinks] = useState<SocialLinks>({});

  // location switch
  const [locationChangedAt, setLocationChangedAt] = useState<string | null>(null);

  // travel schedule
  const [travelEntries, setTravelEntries] = useState<TravelEntry[]>([]);
  const [showTravelSchedule, setShowTravelSchedule] = useState(false);
  const [showReviews, setShowReviews] = useState(false);
  const [travelLoading, setTravelLoading] = useState(false);
  const [newTravel, setNewTravel] = useState({ from_date: "", to_date: "", city: "", country: "" });
  const [travelError, setTravelError] = useState("");
  const [timezone, setTimezone] = useState("Europe/Copenhagen");
  const [openingHours, setOpeningHours] = useState<OpeningHours>(defaultHours());

  const [form, setForm] = useState({
    display_name: "", title: "", category: "", gender: "", age: "", location: "",
    country: "", countryName: "", region: "", regionName: "",
    about: "", services: [] as string[], languages: [] as string[],
    rate_1hour: "", rate_2hours: "", rate_overnight: "", rate_weekend: "",
    phone: "", whatsapp: "", telegram: "", snapchat: "", email: "",
    height: "", weight: "", body_build: "", hair_color: "", hair_length: "",
    eye_color: "", grooming: "", bra_size: "", bust_type: "",
    nationality: "", ethnicity: "", orientation: "", smoker: "", tattoo: "",
    piercing: [] as string[], travel_availability: "", available_for: "",
    meeting_with: [] as string[],
    onlyfans_username: "", onlyfans_price_usd: "",
    outcall: false, handicap_friendly: false, has_own_place: false,
    viber: "", wechat: "", line_app: "", signal: "",
    contact_viber: false, contact_whatsapp: false, contact_wechat: false,
    contact_telegram: false, contact_line: false, contact_signal: false,
  });

  const updateField = (field: string, value: string | boolean) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const toggleArray = (field: "services" | "languages" | "piercing" | "meeting_with", value: string) =>
    setForm(prev => ({
      ...prev,
      [field]: (prev[field] as string[]).includes(value)
        ? (prev[field] as string[]).filter((v: string) => v !== value)
        : [...(prev[field] as string[]), value],
    }));

  /* ── Travel helpers ── */
  const addTravelEntry = async () => {
    const { from_date, to_date, city, country } = newTravel;
    if (!from_date || !to_date || !city || !country) { setTravelError("Fill in all fields"); return; }
    setTravelLoading(true); setTravelError("");
    try {
      const res = await fetch(`/api/listings/${id}/travel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from_date, to_date, city, country }),
      });
      const json = await res.json();
      if (!res.ok) { setTravelError(json.error ?? "Error"); return; }
      setTravelEntries(prev => [...prev, json.entry].sort((a, b) => a.from_date.localeCompare(b.from_date)));
      setNewTravel({ from_date: "", to_date: "", city: "", country: "" });
    } catch { setTravelError("Noget gik galt"); }
    finally { setTravelLoading(false); }
  };

  const deleteTravelEntry = async (travelId: string) => {
    await fetch(`/api/listings/${id}/travel`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ travel_id: travelId }),
    });
    setTravelEntries(prev => prev.filter(e => e.id !== travelId));
  };

  const toggleTravelVisibility = async (show: boolean) => {
    setShowTravelSchedule(show);
    await fetch(`/api/listings/${id}/travel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "toggle_visibility", show }),
    });
  };

  const toggleReviewsVisibility = async (show: boolean) => {
    setShowReviews(show);
    const supabase = createClient();
    await supabase
      .from("listings")
      .update({ show_reviews: show })
      .eq("id", id);
  };

  /* ─── Load listing ─── */
  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUserId(user.id);

      // Fetch listing
      const { data: listing, error: lErr } = await supabase
        .from("listings")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (lErr || !listing) { setNotFound(true); setPageLoading(false); return; }

      // Fetch user profile for subscription_tier
      const { data: profile } = await supabase
        .from("profiles")
        .select("subscription_tier")
        .eq("id", user.id)
        .single();

      const tier = profile?.subscription_tier || listing.premium_tier || null;
      setUserTier(tier);
      setListingTier(listing.premium_tier || null);

      // Pre-fill form
      setForm({
        display_name: listing.display_name ?? "",
        title: listing.title ?? "",
        category: listing.category ?? "",
        gender: listing.gender ?? "",
        age: String(listing.age ?? ""),
        location: listing.city ?? listing.location ?? "",
        country: listing.country ?? "",
        countryName: listing.country ?? "",
        region: listing.region ?? "",
        regionName: listing.region ?? "",
        about: listing.about ?? "",
        services: listing.services ?? [],
        languages: listing.languages ?? [],
        rate_1hour: listing.rate_1hour ?? "",
        rate_2hours: listing.rate_2hours ?? "",
        rate_overnight: listing.rate_overnight ?? "",
        rate_weekend: listing.rate_weekend ?? "",
        phone: listing.phone ?? "",
        whatsapp: listing.whatsapp ?? "",
        telegram: listing.telegram ?? "",
        snapchat: listing.snapchat ?? "",
        email: listing.email ?? "",
        height: listing.height ? String(listing.height) : "",
        weight: listing.weight ? String(listing.weight) : "",
        body_build: listing.body_build ?? "",
        hair_color: listing.hair_color ?? "",
        hair_length: listing.hair_length ?? "",
        eye_color: listing.eye_color ?? "",
        grooming: listing.grooming ?? "",
        bra_size: listing.bra_size ?? "",
        bust_type: listing.bust_type ?? "",
        nationality: listing.nationality ?? "",
        ethnicity: listing.ethnicity ?? "",
        orientation: listing.orientation ?? "",
        smoker: listing.smoker ?? "",
        tattoo: listing.tattoo ?? "",
        piercing: listing.piercing ?? [],
        travel_availability: listing.travel_availability ?? "",
        available_for: listing.available_for ?? "",
        meeting_with: listing.meeting_with ?? [],
        onlyfans_username: listing.onlyfans_username ?? "",
        onlyfans_price_usd: listing.onlyfans_price_usd ? String(listing.onlyfans_price_usd) : "",
        outcall: listing.outcall ?? false,
        handicap_friendly: listing.handicap_friendly ?? false,
        has_own_place: listing.has_own_place ?? false,
        viber: listing.viber ?? "",
        wechat: listing.wechat ?? "",
        line_app: listing.line_app ?? "",
        signal: listing.signal ?? "",
        contact_viber: listing.contact_viber ?? false,
        contact_whatsapp: listing.contact_whatsapp ?? false,
        contact_wechat: listing.contact_wechat ?? false,
        contact_telegram: listing.contact_telegram ?? false,
        contact_line: listing.contact_line ?? false,
        contact_signal: listing.contact_signal ?? false,
      });

      if (listing.images?.length) setExistingImages(listing.images);
      if (listing.profile_video_url) setProfileVideoUrl(listing.profile_video_url);
      if (listing.voice_message_url) setVoiceMessageUrl(listing.voice_message_url);
      if (listing.social_links) setSocialLinks(listing.social_links);
      if (listing.timezone) setTimezone(listing.timezone);
      if (listing.opening_hours) {
        setOpeningHours(prev => ({ ...prev, ...listing.opening_hours }));
      }
      // Fetch existing videos
      const { data: vids } = await supabase.from("listing_videos").select("*").eq("listing_id", id);
      if (vids) setExistingVideos(vids);

      if (listing.location_changed_at) setLocationChangedAt(listing.location_changed_at);
      if (listing.show_travel_schedule) setShowTravelSchedule(listing.show_travel_schedule);
      if (listing.show_reviews) setShowReviews(listing.show_reviews);

      // Fetch travel entries
      fetch(`/api/listings/${id}/travel`)
        .then(r => r.json())
        .then(d => { if (d.entries) setTravelEntries(d.entries); })
        .catch(() => {});

      setPageLoading(false);
    };
    load();
  }, [id, router]);

  /* ─── Validate step 1 ─── */
  const validateStep1 = () => {
    if (!form.title || !form.category || !form.gender || !form.age || !form.country) {
      setError("Please fill in all required fields."); return false;
    }
    if (parseInt(form.age) < 18) {
      setError("You must be at least 18 years old."); return false;
    }
    setError(""); return true;
  };

  /* ─── Save ─── */
  const handleSave = async () => {
    setSaving(true); setError("");
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.id !== userId) throw new Error("Ikke autoriseret");

      // Upload new images
      let newUrls: string[] = [];
      if (newImageFiles.length > 0) {
        const { uploadImages } = await import("@/lib/uploadImages");
        newUrls = await uploadImages(newImageFiles);
      }

      // Final images = existing (minus removed) + new uploads
      const finalImages = [
        ...existingImages.filter(u => !removedImages.includes(u)),
        ...newUrls,
      ];

      const { error: updateErr } = await supabase.from("listings").update({
        display_name:    form.display_name,
        title:           form.title,
        category:        form.category,
        gender:          form.gender,
        age:             parseInt(form.age),
        location:        form.location,
        city:            form.location,
        country:         form.country,
        region:          form.region,
        about:           form.about,
        services:        form.services,
        languages:       form.languages,
        rate_1hour:      form.rate_1hour,
        rate_2hours:     form.rate_2hours,
        rate_overnight:  form.rate_overnight,
        rate_weekend:    form.rate_weekend,
        phone:           form.phone,
        whatsapp:        form.whatsapp,
        telegram:        form.telegram,
        snapchat:        form.snapchat,
        email:           form.email,
        images:          finalImages,
        profile_image:   finalImages[0] ?? null,
        profile_video_url: profileVideoUrl ?? null,
        height:          form.height ? parseInt(form.height) : null,
        weight:          form.weight ? parseInt(form.weight) : null,
        body_build:      form.body_build || null,
        hair_color:      form.hair_color || null,
        hair_length:     form.hair_length || null,
        eye_color:       form.eye_color || null,
        grooming:        form.grooming || null,
        bra_size:        form.bra_size || null,
        bust_type:       form.bust_type || null,
        nationality:     form.nationality || null,
        ethnicity:       form.ethnicity || null,
        orientation:     form.orientation || null,
        smoker:          form.smoker || null,
        tattoo:          form.tattoo || null,
        piercing:        form.piercing.length > 0 ? form.piercing : null,
        travel_availability: form.travel_availability || null,
        available_for:   form.available_for || null,
        meeting_with:    form.meeting_with.length > 0 ? form.meeting_with : null,
        outcall:         form.outcall,
        handicap_friendly: form.handicap_friendly,
        has_own_place:   form.has_own_place,
        viber:           form.viber || null,
        wechat:          form.wechat || null,
        line_app:        form.line_app || null,
        signal:          form.signal || null,
        contact_viber:   form.contact_viber,
        contact_whatsapp: form.contact_whatsapp,
        contact_wechat:  form.contact_wechat,
        contact_telegram: form.contact_telegram,
        contact_line:    form.contact_line,
        contact_signal:  form.contact_signal,
        opening_hours:   openingHours,
        timezone:        timezone,
        voice_message_url: voiceMessageUrl || null,
        social_links:    Object.keys(socialLinks).length > 0 ? socialLinks : null,
        onlyfans_username: form.onlyfans_username || null,
        onlyfans_price_usd: form.onlyfans_price_usd ? parseFloat(form.onlyfans_price_usd) : null,
        updated_at:      new Date().toISOString(),
        // Keep status as active — no re-approval needed for edits
      }).eq("id", id).eq("user_id", user.id);

      if (updateErr) throw updateErr;

      // Upload new videos
      if (newVideoFiles.length > 0) {
        setVideoUploading(true);
        const { uploadMedia } = await import("@/lib/uploadImages");
        for (let i = 0; i < newVideoFiles.length; i++) {
          const result = await uploadMedia(newVideoFiles[i]);
          const thumbUrl = result.url
            .replace("/upload/", "/upload/so_0/")
            .replace(/\.(mp4|mov|webm)$/, ".jpg");
          await supabase.from("listing_videos").insert({
            listing_id: id,
            url: result.url,
            thumbnail_url: thumbUrl,
            is_locked: newVideoLocked[i] ?? false,
            title: newVideoTitles[i] || null,
            redcoin_price: newVideoPrices[i] || 0,
          });
        }
        setVideoUploading(false);
      }

      setSuccess(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const isPremium = ["basic", "featured", "vip"].includes(userTier || "");

  /* ─── States ─── */
  if (pageLoading) return (
    <DashboardLayout>
      <div className="flex justify-center items-center py-32">
        <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
      </div>
    </DashboardLayout>
  );

  if (notFound) return (
    <DashboardLayout>
      <div className="max-w-lg mx-auto py-16 text-center">
        <p className="text-[16px] font-semibold text-gray-900 mb-2">Annonce ikke fundet</p>
        <p className="text-[14px] text-gray-500 mb-6">Annoncen eksisterer ikke eller du har ikke adgang.</p>
        <button onClick={() => router.push("/dashboard/annoncer")}
          className="px-6 py-2.5 rounded-xl text-[13px] font-semibold text-white"
          style={{ background: "#000" }}>Back</button>
      </div>
    </DashboardLayout>
  );

  if (success) return (
    <DashboardLayout>
      <div className="max-w-lg mx-auto py-12 px-4">
        <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
          <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={28} color="#16A34A" />
          </div>
          <h2 className="text-[20px] font-bold text-gray-900 mb-2">Changes saved</h2>
          <p className="text-[14px] text-gray-500 mb-6">Your changes are saved and visible on your profile immediately.</p>
          <button onClick={() => router.push(`/ads/${id}`)}
            className="w-full py-2.5 rounded-xl text-[13px] font-semibold text-white"
            style={{ background: "#000" }}>Se min profil</button>
        </div>
      </div>
    </DashboardLayout>
  );

  const steps = [
    { num: 1, label: "Basis info" },
    { num: 2, label: "Detaljer" },
    { num: 3, label: "Contact & Images" },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* Plan banner - hide for VIP users, show upgrade for non-VIP */}
        {userTier !== "vip" && (
          userTier && TIER_INFO[userTier] ? (
            <div className="flex items-center gap-3 mb-6 px-4 py-3 rounded-xl"
              style={{ background: TIER_INFO[userTier].bg, border: `1px solid ${TIER_INFO[userTier].color}22` }}>
              <Crown size={16} color={TIER_INFO[userTier].color} />
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-bold uppercase tracking-wider" style={{ color: TIER_INFO[userTier].color }}>
                  {TIER_INFO[userTier].label} Plan
                </p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  {TIER_INFO[userTier].features.join(" · ")}
                </p>
              </div>
              <a href="/premium" className="text-[11px] font-semibold underline flex-shrink-0"
                style={{ color: TIER_INFO[userTier].color }}>Opgrader</a>
            </div>
          ) : (
            <div className="flex items-center gap-3 mb-6 px-4 py-3 rounded-xl bg-gray-50 border border-gray-200">
              <AlertTriangle size={15} color="#9CA3AF" />
              <p className="text-[12px] text-gray-500 flex-1">Free plan — premium features not activated</p>
              <a href="/premium" className="text-[12px] font-semibold text-gray-900 underline flex-shrink-0">Opgrader</a>
            </div>
          )
        )}

        {/* Header */}
        <div className="mb-6">
          <button onClick={() => router.push("/dashboard/annoncer")}
            className="flex items-center gap-1.5 text-[12px] text-gray-400 hover:text-gray-700 mb-3 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Mine annoncer
          </button>
          <h1 className="text-[22px] font-bold text-gray-900">Edit Listing</h1>
        </div>

        {/* Step indicator removed - single page layout */}

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
          {error && (
            <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-[13px] text-red-600 border border-red-100">
              {error}
            </div>
          )}

          {/* ──────── STEP 1 ──────── */}
          {step >= 1 && (
            <div>
              <h2 className="text-[18px] font-bold text-gray-900 mb-6">Basis information</h2>
              <div className="space-y-5">
                {/* Navn */}
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                    Dit navn <span style={{ color: "#DC2626" }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Eks. Sofia, Anna, Maria..."
                    value={form.display_name ?? ""}
                    onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))}
                    style={{ width: "100%", padding: "10px 14px", border: "1px solid #D1D5DB", borderRadius: 0, fontSize: 14, outline: "none", boxSizing: "border-box" }}
                  />
                </div>

                {/* Alder */}
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                    Din alder <span style={{ color: "#DC2626" }}>*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={18}
                    max={99}
                    placeholder="18"
                    value={form.age ?? ""}
                    onChange={e => setForm(f => ({ ...f, age: e.target.value }))}
                    style={{ width: "100%", padding: "10px 14px", border: "1px solid #D1D5DB", borderRadius: 0, fontSize: 14, outline: "none", boxSizing: "border-box" }}
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[13px] font-medium text-gray-700">Annonce titel <span className="text-red-500">*</span></label>
                  <input type="text" value={form.title} onChange={e => updateField("title", e.target.value)}
                    placeholder="F.eks. Sofia - Diskret escort i København"
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-[13px] focus:border-gray-400 focus:outline-none focus:ring-0" />
                </div>

                <div>
                  <label className="mb-1.5 block text-[13px] font-medium text-gray-700">Kategori <span className="text-red-500">*</span></label>
                  <select value={form.category} onChange={e => updateField("category", e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-[13px] focus:border-gray-400 focus:outline-none bg-white">
                    <option value="">Select category</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-[13px] font-medium text-gray-700">Køn <span className="text-red-500">*</span></label>
                  <div className="flex gap-3 flex-wrap">
                    {GENDERS.map(g => (
                      <button key={g} type="button" onClick={() => updateField("gender", g)}
                        className="rounded-full border px-5 py-2 text-[13px] font-medium transition"
                        style={{ borderColor: form.gender === g ? "#000" : "#E5E7EB", background: form.gender === g ? "#000" : "#fff", color: form.gender === g ? "#fff" : "#374151" }}>
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-[13px] font-medium text-gray-700">Alder <span className="text-red-500">*</span></label>
                  <input type="number" min={18} max={99} value={form.age} onChange={e => updateField("age", e.target.value)}
                    placeholder="18"
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-[13px] focus:border-gray-400 focus:outline-none focus:ring-0" />
                </div>

                <div>
                  <label className="mb-1.5 block text-[13px] font-medium text-gray-700">Lokation <span className="text-red-500">*</span></label>
                  <LocationSelector
                    value={{ country: form.country, countryName: form.countryName, region: form.region, regionName: form.regionName, city: form.location }}
                    onChange={val => setForm(prev => ({ ...prev, country: val.country, countryName: val.countryName, region: val.region, regionName: val.regionName, location: val.city }))}
                  />
                </div>
              </div>

              {/* Auto-advance to next section when scrolling */}
            </div>
          )}

          {/* ──────── STEP 2 ──────── */}
          {step >= 1 && (
            <div>
              <h2 className="text-[18px] font-bold text-gray-900 mb-6">Om dig og dine services</h2>
              <div className="space-y-5">

                <div>
                  <label className="mb-1.5 block text-[13px] font-medium text-gray-700">Om mig</label>
                  <textarea rows={5} value={form.about} onChange={e => updateField("about", e.target.value)}
                    placeholder="Beskriv dig selv og hvad du tilbyder..."
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-[13px] focus:border-gray-400 focus:outline-none focus:ring-0 resize-none" />
                </div>

                <div>
                  <label className="mb-1.5 block text-[13px] font-medium text-gray-700">Services</label>
                  <div className="flex flex-wrap gap-2">
                    {SERVICE_OPTIONS.map(s => (
                      <button key={s} type="button" onClick={() => toggleArray("services", s)}
                        className="rounded-full border px-4 py-1.5 text-[12px] transition"
                        style={{ borderColor: form.services.includes(s) ? "#000" : "#E5E7EB", background: form.services.includes(s) ? "#000" : "#fff", color: form.services.includes(s) ? "#fff" : "#6B7280" }}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-[13px] font-medium text-gray-700">Sprog</label>
                  <div className="flex flex-wrap gap-2">
                    {LANGUAGE_OPTIONS.map(l => (
                      <button key={l} type="button" onClick={() => toggleArray("languages", l)}
                        className="rounded-full border px-4 py-1.5 text-[12px] transition"
                        style={{ borderColor: form.languages.includes(l) ? "#000" : "#E5E7EB", background: form.languages.includes(l) ? "#000" : "#fff", color: form.languages.includes(l) ? "#fff" : "#6B7280" }}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Priser */}
                <div>
                  <label className="mb-1.5 block text-[13px] font-medium text-gray-700">Priser</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[{ field: "rate_1hour", label: "1 time" }, { field: "rate_2hours", label: "2 timer" }, { field: "rate_overnight", label: "Overnat" }, { field: "rate_weekend", label: "Weekend" }].map(r => (
                      <div key={r.field}>
                        <span className="mb-1 block text-[11px] text-gray-400">{r.label}</span>
                        <input type="text" value={form[r.field as keyof typeof form] as string}
                          onChange={e => updateField(r.field, e.target.value)}
                          placeholder="e.g. 500 DKK"
                          className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-[13px] focus:border-gray-400 focus:outline-none" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Udseende */}
                <div className="pt-1">
                  <p className="text-[13px] font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-100">Udseende & Detaljer</p>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <span className="mb-1 block text-[11px] text-gray-400">Height (cm)</span>
                      <input type="number" min={100} max={250} value={form.height} onChange={e => updateField("height", e.target.value)}
                        placeholder="170"
                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-[13px] focus:border-gray-400 focus:outline-none" />
                    </div>
                    <div>
                      <span className="mb-1 block text-[11px] text-gray-400">Weight (kg)</span>
                      <input type="number" min={30} max={200} value={form.weight} onChange={e => updateField("weight", e.target.value)}
                        placeholder="60"
                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-[13px] focus:border-gray-400 focus:outline-none" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    {[
                      { field: "body_build", label: "Body build", opts: BODY_BUILD_OPTIONS },
                      { field: "hair_color", label: "Hair color", opts: HAIR_COLOR_OPTIONS },
                      { field: "hair_length", label: "Hair length", opts: HAIR_LENGTH_OPTIONS },
                      { field: "eye_color", label: "Eye color", opts: EYE_COLOR_OPTIONS },
                      { field: "grooming", label: "Pubic hair", opts: GROOMING_OPTIONS },
                      { field: "ethnicity", label: "Ethnicity", opts: ETHNICITY_OPTIONS },
                      { field: "orientation", label: "Orientation", opts: ORIENTATION_OPTIONS },
                      { field: "nationality", label: "Nationality", opts: NATIONALITY_OPTIONS },
                    ].map(s => (
                      <div key={s.field}>
                        <span className="mb-1 block text-[11px] text-gray-400">{s.label}</span>
                        <select value={form[s.field as keyof typeof form] as string}
                          onChange={e => updateField(s.field, e.target.value)}
                          className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-[13px] focus:border-gray-400 focus:outline-none bg-white">
                          <option value="">Select</option>
                          {s.opts.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div>
                      <span className="mb-1 block text-[11px] text-gray-400">Bust size</span>
                      <select value={form.bra_size} onChange={e => updateField("bra_size", e.target.value)}
                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-[13px] focus:border-gray-400 focus:outline-none bg-white">
                        <option value="">Select</option>
                        {BRA_SIZE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                    <div>
                      <span className="mb-1 block text-[11px] text-gray-400">Bust type</span>
                      <select value={form.bust_type} onChange={e => updateField("bust_type", e.target.value)}
                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-[13px] focus:border-gray-400 focus:outline-none bg-white">
                        <option value="">Select</option>
                        {BUST_TYPE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                    <div>
                      <span className="mb-1 block text-[11px] text-gray-400">Smoker</span>
                      <select value={form.smoker} onChange={e => updateField("smoker", e.target.value)}
                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-[13px] focus:border-gray-400 focus:outline-none bg-white">
                        <option value="">Select</option>
                        {SMOKER_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                    <div>
                      <span className="mb-1 block text-[11px] text-gray-400">Tattoo</span>
                      <select value={form.tattoo} onChange={e => updateField("tattoo", e.target.value)}
                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-[13px] focus:border-gray-400 focus:outline-none bg-white">
                        <option value="">Select</option>
                        {TATTOO_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                    <div>
                      <span className="mb-1 block text-[11px] text-gray-400">Travel</span>
                      <select value={form.travel_availability} onChange={e => updateField("travel_availability", e.target.value)}
                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-[13px] focus:border-gray-400 focus:outline-none bg-white">
                        <option value="">Select</option>
                        {TRAVEL_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                    <div>
                      <span className="mb-1 block text-[11px] text-gray-400">Available for</span>
                      <select value={form.available_for} onChange={e => updateField("available_for", e.target.value)}
                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-[13px] focus:border-gray-400 focus:outline-none bg-white">
                        <option value="">Select</option>
                        {AVAILABLE_FOR_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                  </div>
                  {/* Piercing */}
                  <div className="mb-3">
                    <span className="mb-2 block text-[11px] text-gray-400">Piercing</span>
                    <div className="flex flex-wrap gap-2">
                      {PIERCING_OPTIONS.map(p => (
                        <button key={p} type="button" onClick={() => toggleArray("piercing", p)}
                          className="px-3 py-1.5 rounded-full text-[12px] font-medium border transition-colors"
                          style={{ borderColor: form.piercing.includes(p) ? "#000" : "#E5E7EB", background: form.piercing.includes(p) ? "#000" : "#fff", color: form.piercing.includes(p) ? "#fff" : "#6B7280" }}>
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Meeting with */}
                  <div className="mb-3">
                    <span className="mb-2 block text-[11px] text-gray-400">Meeting with</span>
                    <div className="flex flex-wrap gap-2">
                      {["Man", "Woman", "Couple", "Multiple men", "Everyone"].map(m => (
                        <button key={m} type="button" onClick={() => toggleArray("meeting_with", m)}
                          className="px-3 py-1.5 rounded-full text-[12px] font-medium border transition-colors"
                          style={{ borderColor: form.meeting_with.includes(m) ? "#000" : "#E5E7EB", background: form.meeting_with.includes(m) ? "#000" : "#fff", color: form.meeting_with.includes(m) ? "#fff" : "#6B7280" }}>
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    {[
                      { field: "outcall", label: "Outcall" },
                      { field: "handicap_friendly", label: "Handicap friendly" },
                      { field: "has_own_place", label: "Has own place" },
                    ].map(c => (
                      <label key={c.field} className="flex items-center gap-2 text-[13px] text-gray-700 cursor-pointer">
                        <input type="checkbox" checked={form[c.field as keyof typeof form] as boolean}
                          onChange={e => updateField(c.field, e.target.checked)}
                          className="rounded border-gray-300" />
                        {c.label}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Navigation hidden - single page view */}
            </div>
          )}

          {/* ──────── STEP 3 ──────── */}
          {step >= 1 && (
            <div>
              <h2 className="text-[18px] font-bold text-gray-900 mb-6">Contact & Images</h2>
              <div className="space-y-6">

                {/* Kontakt */}
                <div>
                  <p className="text-[13px] font-semibold text-gray-900 mb-3">Contact</p>
                  <div className="space-y-2.5">
                    <PhoneInput
                      label="📞 Phone"
                      value={form.phone as string}
                      onChange={v => updateField("phone", v)}
                      required
                    />
                    <PhoneInput
                      label="📞 Phone 2"
                      value={(form as { phone2?: string }).phone2 ?? ""}
                      onChange={v => updateField("phone2", v)}
                    />
                    <div className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-2.5">
                      <span className="w-20 text-[12px] text-gray-400 flex-shrink-0">Email</span>
                      <input type="email"
                        value={form.email as string}
                        onChange={e => updateField("email", e.target.value)}
                        placeholder="Email"
                        className="flex-1 text-[13px] bg-transparent border-0 outline-none text-gray-900" />
                    </div>
                  </div>
                  {/* Messaging apps */}
                  <p className="text-[12px] text-gray-500 mt-4 mb-2">Messaging apps</p>
                  <div className="space-y-2">
                    {/* WhatsApp med PhoneInput */}
                    <div>
                      <PhoneInput
                        label="💬 WhatsApp"
                        value={form.whatsapp as string}
                        onChange={v => updateField("whatsapp", v)}
                      />
                      <label className="flex items-center gap-1.5 text-[11px] text-gray-400 cursor-pointer mt-1.5 ml-1">
                        <input type="checkbox"
                          checked={form.contact_whatsapp as boolean}
                          onChange={e => updateField("contact_whatsapp", e.target.checked)}
                          className="rounded border-gray-300" />
                        Show WhatsApp button
                      </label>
                    </div>
                    {[
                      { app: "Telegram", field: "telegram", toggle: "contact_telegram", icon: "✈️" },
                      { app: "Viber",    field: "viber",    toggle: "contact_viber",    icon: "📳" },
                      { app: "WeChat",   field: "wechat",   toggle: "contact_wechat",   icon: "💚" },
                      { app: "LINE",     field: "line_app", toggle: "contact_line",     icon: "🟢" },
                      { app: "Signal",   field: "signal",   toggle: "contact_signal",   icon: "🔒" },
                      { app: "Snapchat", field: "snapchat", toggle: "", icon: "👻" },
                    ].map(c => (
                      <div key={c.field} className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-2.5">
                        <span className="text-base">{c.icon}</span>
                        <span className="w-16 text-[12px] text-gray-400 flex-shrink-0">{c.app}</span>
                        <input type="text"
                          value={form[c.field as keyof typeof form] as string}
                          onChange={e => updateField(c.field, e.target.value)}
                          placeholder={`${c.app} ID / number`}
                          className="flex-1 text-[13px] bg-transparent border-0 outline-none text-gray-900" />
                        {c.toggle && (
                          <label className="flex items-center gap-1 text-[11px] text-gray-400 cursor-pointer flex-shrink-0">
                            <input type="checkbox"
                              checked={form[c.toggle as keyof typeof form] as boolean}
                              onChange={e => updateField(c.toggle, e.target.checked)}
                              className="rounded border-gray-300" />
                            Show
                          </label>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Social links */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[13px] font-semibold text-gray-900">Social Media Links</p>
                    {!isPremium && (
                      <span className="text-[11px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Locking requires premium</span>
                    )}
                  </div>
                  <SocialLinksEditor value={socialLinks} onChange={setSocialLinks} isPremium={isPremium} />
                </div>

                {/* OnlyFans Profile */}
                <div>
                  <p className="text-[13px] font-semibold text-gray-900 mb-3">OnlyFans Profile</p>
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-2.5">
                      <span className="w-24 text-[12px] text-gray-400 flex-shrink-0">@username</span>
                      <input
                        type="text"
                        value={form.onlyfans_username}
                        onChange={e => updateField("onlyfans_username", e.target.value)}
                        placeholder="username"
                        className="flex-1 text-[13px] bg-transparent border-0 outline-none text-gray-900"
                      />
                    </div>
                    <div className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-2.5">
                      <span className="w-24 text-[12px] text-gray-400 flex-shrink-0">Price (USD)</span>
                      <input
                        type="number"
                        value={form.onlyfans_price_usd}
                        onChange={e => updateField("onlyfans_price_usd", e.target.value)}
                        placeholder="9.99"
                        min="0"
                        step="0.01"
                        className="flex-1 text-[13px] bg-transparent border-0 outline-none text-gray-900"
                      />
                    </div>
                  </div>
                </div>

                {/* ── Skift Lokation (Premium only) ── */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[13px] font-semibold text-gray-900">Skift Lokation</p>
                    {!isPremium && (
                      <span className="text-[11px] font-semibold text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">Premium only</span>
                    )}
                  </div>
                  {isPremium ? (
                    <LocationSwitchPanel
                      listingId={id}
                      currentCountry={form.country}
                      currentCity={form.location}
                      locationChangedAt={locationChangedAt}
                      onSuccess={(country, city) => {
                        updateField("country", country);
                        updateField("location", city);
                        setLocationChangedAt(new Date().toISOString());
                      }}
                    />
                  ) : (
                    <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-center">
                      <Crown size={18} color="#B45309" className="mx-auto mb-2" />
                      <p className="text-[13px] font-semibold text-amber-900 mb-1">Upgrade to Premium</p>
                      <p className="text-[12px] text-amber-700 mb-3">Change your location once a day</p>
                      <a href="/premium" className="text-[12px] font-semibold text-amber-700 underline">See premium plans →</a>
                    </div>
                  )}
                </div>

                {/* ── Travel Schedule (Premium only) ── */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[13px] font-semibold text-gray-900">Travel Schedule</p>
                    {!isPremium && (
                      <span className="text-[11px] font-semibold text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">Premium only</span>
                    )}
                  </div>
                  {isPremium ? (
                    <div className="space-y-3">
                      {/* Visibility toggle */}
                      <button
                        onClick={() => toggleTravelVisibility(!showTravelSchedule)}
                        className="flex items-center gap-2 text-[13px] font-medium rounded-xl border px-4 py-2.5 transition-colors w-full"
                        style={{
                          background: showTravelSchedule ? "#F0FDF4" : "#F9FAFB",
                          borderColor: showTravelSchedule ? "#86EFAC" : "#E5E7EB",
                          color: showTravelSchedule ? "#15803D" : "#6B7280",
                        }}
                      >
                        {showTravelSchedule ? <Eye size={14} /> : <EyeOff size={14} />}
                        {showTravelSchedule ? "Travel schedule er offentligt" : "Travel schedule er skjult"}
                      </button>

                      {/* Existing entries */}
                      {travelEntries.length > 0 && (
                        <div className="space-y-1.5">
                          {travelEntries.map(e => (
                            <div key={e.id} className="flex items-center gap-3 rounded-xl border border-gray-200 px-3 py-2.5">
                              <span className="text-[12px] text-gray-500 flex-shrink-0 whitespace-nowrap">
                                {new Date(e.from_date + "T00:00:00").toLocaleDateString("da-DK", { day: "numeric", month: "short" })} – {new Date(e.to_date + "T00:00:00").toLocaleDateString("da-DK", { day: "numeric", month: "short" })}
                              </span>
                              <span className="text-[13px] text-gray-700 flex-1 truncate">{e.city}, {e.country}</span>
                              <button onClick={() => deleteTravelEntry(e.id)}
                                className="p-1 rounded transition-colors flex-shrink-0"
                                style={{ color: "#9CA3AF" }}
                                onMouseEnter={e2 => { e2.currentTarget.style.color = "#DC2626"; }}
                                onMouseLeave={e2 => { e2.currentTarget.style.color = "#9CA3AF"; }}>
                                <Trash2 size={13} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add new entry */}
                      <div className="rounded-xl border border-dashed border-gray-300 p-4 space-y-2.5">
                        <p className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider">Add destination</p>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[11px] text-gray-400 block mb-1">Fra dato</label>
                            <input type="date" value={newTravel.from_date}
                              onChange={e => setNewTravel(p => ({ ...p, from_date: e.target.value }))}
                              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] focus:outline-none" />
                          </div>
                          <div>
                            <label className="text-[11px] text-gray-400 block mb-1">Til dato</label>
                            <input type="date" value={newTravel.to_date}
                              onChange={e => setNewTravel(p => ({ ...p, to_date: e.target.value }))}
                              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] focus:outline-none" />
                          </div>
                        </div>
                        <input type="text" placeholder="By (fx København)"
                          value={newTravel.city}
                          onChange={e => setNewTravel(p => ({ ...p, city: e.target.value }))}
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] focus:outline-none placeholder-gray-400" />
                        <select value={newTravel.country}
                          onChange={e => setNewTravel(p => ({ ...p, country: e.target.value }))}
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] focus:outline-none bg-white">
                          <option value="">Select country…</option>
                          {SUPPORTED_COUNTRIES_SORTED.map(c => (
                            <option key={c.code} value={c.name}>{c.flag} {c.name}</option>
                          ))}
                        </select>
                        {travelError && <p className="text-[12px] text-red-500">{travelError}</p>}
                        <button onClick={addTravelEntry} disabled={travelLoading}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-semibold text-white transition-colors disabled:opacity-50"
                          style={{ background: "#000" }}>
                          <Plus size={14} />
                          {travelLoading ? "Saving…" : "Add"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-center">
                      <Crown size={18} color="#B45309" className="mx-auto mb-2" />
                      <p className="text-[13px] font-semibold text-amber-900 mb-1">Upgrade to Premium</p>
                      <p className="text-[12px] text-amber-700 mb-3">Show future travel plans on your profile</p>
                      <a href="/premium" className="text-[12px] font-semibold text-amber-700 underline">See premium plans →</a>
                    </div>
                  )}
                </div>

                {/* Reviews Toggle (Premium only) */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[13px] font-semibold text-gray-900">Reviews</p>
                    {!isPremium && (
                      <span className="text-[11px] font-semibold text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">Premium only</span>
                    )}
                  </div>
                  {isPremium ? (
                    <div className="space-y-3">
                      <button
                        onClick={() => toggleReviewsVisibility(!showReviews)}
                        className="flex items-center gap-2 text-[13px] font-medium rounded-xl border px-4 py-2.5 transition-colors w-full"
                        style={{
                          background: showReviews ? "#F0FDF4" : "#F9FAFB",
                          borderColor: showReviews ? "#86EFAC" : "#E5E7EB",
                          color: showReviews ? "#15803D" : "#6B7280",
                        }}
                      >
                        {showReviews ? <Eye size={14} /> : <EyeOff size={14} />}
                        {showReviews ? "Reviews are enabled on your profile" : "Reviews are disabled"}
                      </button>
                      <p className="text-[12px] text-gray-400">
                        When reviews are enabled, customers can write reviews on your profile.
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-center">
                      <Crown size={18} color="#B45309" className="mx-auto mb-2" />
                      <p className="text-[13px] font-semibold text-amber-900 mb-1">Upgrade to Premium</p>
                      <p className="text-[12px] text-amber-700 mb-3">Enable reviews on your profile to build credibility</p>
                      <a href="/premium" className="text-[12px] font-semibold text-amber-700 underline">See premium plans →</a>
                    </div>
                  )}
                </div>

                {/* Opening hours */}
                <div>
                  <p className="text-[13px] font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-100">Opening Hours & Availability</p>
                  <div className="mb-3">
                    <label className="text-[12px] font-medium text-gray-600 block mb-1">Tidszone</label>
                    <select value={timezone} onChange={e => setTimezone(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-[13px] focus:outline-none bg-white">
                      {TIMEZONE_OPTIONS.map(g => (
                        <optgroup key={g.group} label={g.group}>
                          {g.zones.map(tz => <option key={tz} value={tz}>{tz.replace(/_/g, " ").replace(/\//g, " / ")}</option>)}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                  <div className="rounded-xl overflow-hidden border border-gray-100">
                    <div className="grid grid-cols-[110px_1fr_1fr_70px] bg-gray-50 px-4 py-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                      <span>Day</span><span>Opens</span><span>Closes</span><span className="text-right">Closed</span>
                    </div>
                    {DAYS_OF_WEEK.map(day => {
                      const h = openingHours[day];
                      return (
                        <div key={day} className={`grid grid-cols-[110px_1fr_1fr_70px] items-center gap-2 px-4 py-2.5 border-b border-gray-50 last:border-0 ${h.closed ? "opacity-50 bg-gray-50/60" : "bg-white"}`}>
                          <span className="text-[12px] font-medium text-gray-700">{DAY_LABELS[day]}</span>
                          <select disabled={h.closed} value={h.open}
                            onChange={e => setOpeningHours(p => ({ ...p, [day]: { ...p[day], open: e.target.value } }))}
                            className="rounded-lg border border-gray-200 px-2 py-1.5 text-[12px] focus:outline-none disabled:bg-gray-100">
                            {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                          <select disabled={h.closed} value={h.close}
                            onChange={e => setOpeningHours(p => ({ ...p, [day]: { ...p[day], close: e.target.value } }))}
                            className="rounded-lg border border-gray-200 px-2 py-1.5 text-[12px] focus:outline-none disabled:bg-gray-100">
                            {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                          <div className="flex justify-end">
                            <button type="button" onClick={() => setOpeningHours(p => ({ ...p, [day]: { ...p[day], closed: !p[day].closed } }))}
                              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${h.closed ? "bg-gray-300" : "bg-gray-900"}`}>
                              <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${h.closed ? "translate-x-0.5" : "translate-x-4"}`} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Billeder */}
                <div>
                  <p className="text-[13px] font-semibold text-gray-900 mb-3">Images</p>

                  {/* Existing images */}
                  {existingImages.filter(u => !removedImages.includes(u)).length > 0 && (
                    <div className="mb-3">
                      <p className="text-[11px] text-gray-400 mb-2">Eksisterende billeder</p>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                        {existingImages.filter(u => !removedImages.includes(u)).map((url, i) => (
                          <div key={url} className="relative group aspect-square">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={url} alt={`img ${i+1}`} className="w-full h-full object-cover rounded-xl" />
                            {i === 0 && (
                              <span className="absolute top-1 left-1 bg-gray-900 text-white text-[10px] px-1.5 py-0.5 rounded-md font-medium">Profil</span>
                            )}
                            <button type="button"
                              onClick={() => setRemovedImages(prev => [...prev, url])}
                              className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* New images */}
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-gray-400 transition-colors"
                    onClick={() => document.getElementById("edit-image-input")?.click()}>
                    <svg className="w-7 h-7 text-gray-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4"/></svg>
                    <p className="text-[13px] text-gray-400">Add photos</p>
                    <input id="edit-image-input" type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden"
                      onChange={e => {
                        const files = Array.from(e.target.files || []);
                        const keep = files.slice(0, 20 - existingImages.filter(u => !removedImages.includes(u)).length - newImageFiles.length);
                        setNewImageFiles(prev => [...prev, ...keep]);
                        keep.forEach(f => {
                          const r = new FileReader();
                          r.onload = ev => setNewImagePreviews(prev => [...prev, ev.target?.result as string]);
                          r.readAsDataURL(f);
                        });
                      }} />
                  </div>
                  {newImagePreviews.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-3">
                      {newImagePreviews.map((src, i) => (
                        <div key={i} className="relative group aspect-square">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={src} alt={`ny ${i+1}`} className="w-full h-full object-cover rounded-xl" />
                          <span className="absolute top-1 left-1 bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-md font-medium">Ny</span>
                          <button type="button" onClick={() => { setNewImageFiles(p => p.filter((_, idx) => idx !== i)); setNewImagePreviews(p => p.filter((_, idx) => idx !== i)); }}
                            className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Videoer */}
                <div>
                  <p className="text-[13px] font-semibold text-gray-900 mb-3">Mine Videoer</p>

                  {/* Animated profile picture — info */}
                  {existingVideos.length > 0 && (
                    <div className="mb-3 p-3 rounded-lg text-[12px]" style={{ background: "#FFF7ED", border: "1px solid #FED7AA", color: "#92400E" }}>
                      🎬 <strong>Animated profile picture:</strong> Select a video below as your profile picture. It will display animated in card view, premium carousel and listings.
                    </div>
                  )}

                  {/* Eksisterende videoer */}
                  {existingVideos.map(v => (
                    <div key={v.id} className="flex flex-col gap-2 p-3 border border-gray-200 rounded-xl mb-2"
                      style={{ borderColor: profileVideoUrl === v.url ? "#DC2626" : "#E5E7EB" }}>
                      <div className="flex items-center gap-3">
                        {v.thumbnail_url && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={v.thumbnail_url} alt="" className="w-16 h-12 object-cover rounded" />
                        )}
                        <div className="flex-1 min-w-0 flex items-center gap-2">
                          <input type="text" placeholder="Videotitel" value={v.title ?? ""}
                            onChange={async e => {
                              const supabase = createClient();
                              await supabase.from("listing_videos").update({ title: e.target.value }).eq("id", v.id);
                              setExistingVideos(prev => prev.map(x => x.id === v.id ? { ...x, title: e.target.value } : x));
                            }}
                            className="text-sm border rounded px-2 py-1 flex-1" />
                        </div>
                        <button
                          type="button"
                          onClick={() => setProfileVideoUrl(profileVideoUrl === v.url ? null : v.url)}
                          className="text-[11px] font-semibold px-2 py-1 rounded flex-shrink-0"
                          style={{ background: profileVideoUrl === v.url ? "#DC2626" : "#F3F4F6", color: profileVideoUrl === v.url ? "#fff" : "#374151" }}
                        >
                          {profileVideoUrl === v.url ? "✓ Profile image" : "🎬 Set as profile"}
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            const supabase = createClient();
                            await supabase.from("listing_videos").delete().eq("id", v.id);
                            setExistingVideos(prev => prev.filter(x => x.id !== v.id));
                            if (profileVideoUrl === v.url) setProfileVideoUrl(null);
                          }}
                          className="text-red-500 hover:text-red-700 text-sm font-medium"
                        >
                          Delete
                        </button>
                      </div>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 text-sm text-gray-500">
                          <input
                            type="checkbox"
                            checked={v.is_locked}
                            onChange={async (e) => {
                              const supabase = createClient();
                              await supabase.from("listing_videos").update({ is_locked: e.target.checked }).eq("id", v.id);
                              setExistingVideos(prev => prev.map(x => x.id === v.id ? { ...x, is_locked: e.target.checked } : x));
                            }}
                          />
                          Locked (requires RedCoins)
                        </label>
                        {v.is_locked && (
                          <input type="number" min={0} placeholder="Pris i RC" value={v.redcoin_price ?? 0}
                            onChange={async e => {
                              const price = parseInt(e.target.value) || 0;
                              const supabase = createClient();
                              await supabase.from("listing_videos").update({ redcoin_price: price }).eq("id", v.id);
                              setExistingVideos(prev => prev.map(x => x.id === v.id ? { ...x, redcoin_price: price } : x));
                            }}
                            className="text-sm border rounded px-2 py-1 w-24" />
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Upload nye videoer */}
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl py-6 cursor-pointer hover:border-gray-400 transition-colors">
                    <input
                      type="file"
                      accept="video/*"
                      multiple
                      className="hidden"
                      onChange={e => {
                        const files = Array.from(e.target.files ?? []).slice(0, 10 - existingVideos.length - newVideoFiles.length);
                        setNewVideoFiles(prev => [...prev, ...files]);
                        setNewVideoLocked(prev => [...prev, ...files.map(() => false)]);
                        setNewVideoTitles(prev => [...prev, ...files.map(() => "")]);
                        setNewVideoPrices(prev => [...prev, ...files.map(() => 0)]);
                      }}
                    />
                    <svg className="w-7 h-7 text-gray-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" /></svg>
                    <span className="text-[13px] text-gray-400">+ Upload video (maks 10 i alt)</span>
                  </label>

                  {/* Preview nye videoer */}
                  {newVideoFiles.map((f, i) => (
                    <div key={i} className="flex flex-col gap-2 p-3 border border-blue-200 rounded-xl bg-blue-50 mt-2">
                      <div className="flex items-center gap-3">
                        <input type="text" placeholder="Videotitel" value={newVideoTitles[i] ?? ""}
                          onChange={e => setNewVideoTitles(prev => prev.map((t, j) => j === i ? e.target.value : t))}
                          className="text-sm border rounded px-2 py-1 flex-1" />
                        <button
                          type="button"
                          onClick={() => {
                            setNewVideoFiles(prev => prev.filter((_, j) => j !== i));
                            setNewVideoLocked(prev => prev.filter((_, j) => j !== i));
                            setNewVideoTitles(prev => prev.filter((_, j) => j !== i));
                            setNewVideoPrices(prev => prev.filter((_, j) => j !== i));
                          }}
                          className="text-red-500 hover:text-red-700 font-medium"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-500 truncate max-w-[150px]">{f.name}</span>
                        <label className="flex items-center gap-1 text-sm text-gray-600">
                          <input
                            type="checkbox"
                            checked={newVideoLocked[i]}
                            onChange={e => setNewVideoLocked(prev => prev.map((v, j) => j === i ? e.target.checked : v))}
                          />
                          Låst
                        </label>
                        {newVideoLocked[i] && (
                          <input type="number" min={0} placeholder="Pris i RC" value={newVideoPrices[i] ?? 0}
                            onChange={e => setNewVideoPrices(prev => prev.map((p, j) => j === i ? (parseInt(e.target.value) || 0) : p))}
                            className="text-sm border rounded px-2 py-1 w-24" />
                        )}
                      </div>
                    </div>
                  ))}

                  {videoUploading && (
                    <p className="text-sm text-gray-500 mt-2">Uploader videoer...</p>
                  )}
                </div>

                {/* Voice message */}
                <div className="rounded-xl border border-gray-100 p-4 bg-gray-50/50">
                  <div className="flex items-center gap-2 mb-3">
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/></svg>
                    <p className="text-[13px] font-semibold text-gray-700">Voice Message</p>
                    {!isPremium && <span className="ml-auto text-[11px] font-semibold text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">Premium only</span>}
                  </div>
                  {isPremium ? (
                    <VoiceRecorder onUpload={url => setVoiceMessageUrl(url)} existingUrl={voiceMessageUrl || null} />
                  ) : (
                    <div className="rounded-xl bg-white border border-dashed border-gray-200 p-4 text-center">
                      <p className="text-[12px] text-gray-400">Upgrade to Premium to add a voice message</p>
                      <a href="/premium" className="text-[12px] font-semibold text-gray-900 underline mt-1 inline-block">See plans</a>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button onClick={handleSave} disabled={saving}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] font-semibold text-white disabled:opacity-50"
                  style={{ background: "#000" }}>
                  {saving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  Save changes
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
