"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { createClient } from "@/lib/supabase";
import LocationSelector from "@/components/LocationSelector";
import VoiceRecorder from "@/components/VoiceRecorder";
import SocialLinksEditor from "@/components/SocialLinksEditor";
import type { SocialLinks } from "@/components/SocialLinksSection";
import { CreditCard, Banknote, Coins, Zap } from "lucide-react";

const PAYMENT_OPTIONS = [
  { id: "revolut",   label: "Revolut",    icon: CreditCard },
  { id: "cash",      label: "Cash",       icon: Banknote },
  { id: "redcoins",  label: "Red Coins",  icon: Coins },
  { id: "crypto",    label: "Crypto",     icon: Zap },
];

const DAYS_OF_WEEK = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"] as const;
type DayKey = typeof DAYS_OF_WEEK[number];
const DAY_LABELS: Record<DayKey, string> = { monday:"Monday", tuesday:"Tuesday", wednesday:"Wednesday", thursday:"Thursday", friday:"Friday", saturday:"Saturday", sunday:"Sunday" };

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2); const m = i % 2 === 0 ? "00" : "30";
  return `${String(h).padStart(2, "0")}:${m}`;
});

const TIMEZONE_OPTIONS = [
  { group: "Europe", zones: ["Europe/Copenhagen","Europe/London","Europe/Paris","Europe/Berlin","Europe/Amsterdam","Europe/Oslo","Europe/Stockholm","Europe/Madrid","Europe/Rome","Europe/Athens","Europe/Warsaw","Europe/Helsinki","Europe/Zurich","Europe/Lisbon"] },
  { group: "Americas", zones: ["America/New_York","America/Chicago","America/Denver","America/Los_Angeles","America/Toronto","America/Vancouver","America/Sao_Paulo","America/Bogota","America/Lima","America/Santiago","America/Mexico_City","America/Buenos_Aires"] },
  { group: "Asia", zones: ["Asia/Dubai","Asia/Bangkok","Asia/Tokyo","Asia/Singapore","Asia/Hong_Kong","Asia/Seoul","Asia/Shanghai","Asia/Kolkata","Asia/Karachi","Asia/Istanbul","Asia/Riyadh","Asia/Jakarta"] },
  { group: "Africa", zones: ["Africa/Cairo","Africa/Lagos","Africa/Johannesburg","Africa/Nairobi","Africa/Casablanca"] },
  { group: "Pacific", zones: ["Pacific/Auckland","Pacific/Sydney","Pacific/Honolulu"] },
];

interface DayHours { open: string; close: string; closed: boolean; }
type OpeningHours = Record<DayKey, DayHours>;
import { CATEGORIES } from "@/lib/constants/categories";
import { GENDERS } from "@/lib/constants/genders";
import {
  BODY_BUILD_OPTIONS,
  HAIR_COLOR_OPTIONS,
  EYE_COLOR_OPTIONS,
  GROOMING_OPTIONS,
  BRA_SIZE_OPTIONS,
  NATIONALITY_OPTIONS,
} from "@/lib/listingOptions";

const SERVICE_OPTIONS = [
  "Dinner dates",
  "Social events",
  "Travel companion",
  "Private meetings",
  "Weekend getaways",
];

// Service label translations (key = English DB value)
const SERVICE_LABELS: Record<string, Record<string, string>> = {
  "Dinner dates":       { en:"Dinner dates", da:"Middagsaftaler", de:"Abendessen", fr:"Dîner en tête-à-tête", es:"Cenas románticas", it:"Cene romantiche", pt:"Jantares", nl:"Etentjes", sv:"Middagar", no:"Middager", ar:"عشاء رومانسي", th:"ทานอาหารค่ำ", ru:"Ужины", pl:"Kolacje" },
  "Social events":      { en:"Social events", da:"Sociale arrangementer", de:"Gesellschaftliche Events", fr:"Événements sociaux", es:"Eventos sociales", it:"Eventi sociali", pt:"Eventos sociais", nl:"Sociale evenementen", sv:"Sociala evenemang", no:"Sosiale arrangementer", ar:"فعاليات اجتماعية", th:"งานสังคม", ru:"Социальные мероприятия", pl:"Imprezy towarzyskie" },
  "Travel companion":   { en:"Travel companion", da:"Rejseledsager", de:"Reisebegleiterin", fr:"Compagnon de voyage", es:"Compañía de viaje", it:"Accompagnatrice viaggi", pt:"Acompanhante de viagem", nl:"Reisgezel", sv:"Ressällskap", no:"Reiseledsager", ar:"رفيق سفر", th:"เพื่อนร่วมเดินทาง", ru:"Попутчик", pl:"Towarzysz podróży" },
  "Private meetings":   { en:"Private meetings", da:"Private møder", de:"Private Treffen", fr:"Rencontres privées", es:"Encuentros privados", it:"Incontri privati", pt:"Encontros privados", nl:"Privéafspraken", sv:"Privata möten", no:"Private møter", ar:"لقاءات خاصة", th:"การพบปะส่วนตัว", ru:"Приватные встречи", pl:"Prywatne spotkania" },
  "Weekend getaways":   { en:"Weekend getaways", da:"Weekendture", de:"Wochenendausflüge", fr:"Escapades week-end", es:"Escapadas de fin de semana", it:"Fughe del weekend", pt:"Fugas de fim de semana", nl:"Weekenduitjes", sv:"Weekendresor", no:"Helgeturer", ar:"رحلات نهاية الأسبوع", th:"ทริปสุดสัปดาห์", ru:"Поездки на выходных", pl:"Weekendowe wyjazdy" },
};

const GENDER_LABELS: Record<string, Record<string, string>> = {
  "female":  { en:"Woman", da:"Kvinde", de:"Frau", fr:"Femme", es:"Mujer", it:"Donna", pt:"Mulher", nl:"Vrouw", sv:"Kvinna", no:"Kvinne", ar:"امرأة", th:"ผู้หญิง", ru:"Женщина", pl:"Kobieta" },
  "male":    { en:"Man", da:"Mand", de:"Mann", fr:"Homme", es:"Hombre", it:"Uomo", pt:"Homem", nl:"Man", sv:"Man", no:"Mann", ar:"رجل", th:"ผู้ชาย", ru:"Мужчина", pl:"Mężczyzna" },
  "trans":   { en:"Trans", da:"Trans", de:"Trans", fr:"Trans", es:"Trans", it:"Trans", pt:"Trans", nl:"Trans", sv:"Trans", no:"Trans", ar:"ترانس", th:"ทรานส์", ru:"Транс", pl:"Trans" },
};

const LANGUAGE_OPTIONS = ["Dansk", "Engelsk", "Tysk", "Fransk", "Spansk"];

export default function OpretAnnoncePage() {
  const router = useRouter()
  const { t, locale } = useLanguage()
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [redirecting, setRedirecting] = useState(true);

  useEffect(() => {
    const checkExisting = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setRedirecting(false); return; }
      const { data: listing } = await supabase
        .from("listings").select("id").eq("user_id", user.id).eq("status", "active").limit(1).single();
      if (listing?.id) {
        alert("Du har allerede en profil. Rediger den her.");
        router.replace(`/dashboard/annoncer/${listing.id}/edit`);
        return;
      }
      setRedirecting(false);
    };
    checkExisting();
  }, [router]);
  const [success, setSuccess] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [voiceMessageUrl, setVoiceMessageUrl] = useState<string>("");
  const [socialLinks, setSocialLinks] = useState<SocialLinks>({});
  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);
  const [userTier, setUserTier] = useState<string | null>(null);
  const [timezone, setTimezone] = useState("Europe/Copenhagen");
  const [openingHours, setOpeningHours] = useState<OpeningHours>(() => {
    const defaults: Partial<OpeningHours> = {};
    DAYS_OF_WEEK.forEach(d => { defaults[d] = { open: "09:00", close: "22:00", closed: d === "sunday" }; });
    return defaults as OpeningHours;
  });

  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz) setTimezone(tz);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    const fetchTier = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase.from("listings")
          .select("premium_tier").eq("user_id", user.id).not("premium_tier", "is", null).limit(1).single();
        if (data?.premium_tier) setUserTier(data.premium_tier);
      } catch { /* no tier */ }
    };
    fetchTier();
  }, []);
  const [form, setForm] = useState({
    display_name: "",
    title: "",
    category: "",
    gender: "",
    age: "",
    location: "",
    country: "",
    countryName: "",
    region: "",
    regionName: "",
    about: "",
    services: [] as string[],
    languages: [] as string[],
    rate_1hour: "",
    rate_2hours: "",
    rate_overnight: "",
    rate_weekend: "",
    phone: "",
    whatsapp: "",
    telegram: "",
    snapchat: "",
    email: "",
    height: "",
    weight: "",
    body_build: "",
    hair_color: "",
    eye_color: "",
    grooming: "",
    bra_size: "",
    nationality: "",
    outcall: false,
    handicap_friendly: false,
    has_own_place: false,
  });

  const updateField = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleArray = (field: "services" | "languages", value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((v) => v !== value)
        : [...prev[field], value],
    }));
  };

  const validateStep1 = () => {
    if (!form.title || !form.category || !form.gender || !form.age || !form.country) {
      setError("Udfyld venligst alle felter.");
      return false;
    }
    if (parseInt(form.age) < 18) {
      setError("Du skal være mindst 18 år.");
      return false;
    }
    setError("");
    return true;
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Du skal være logget ind for at oprette en annonce");

      // Upload images
      let imageUrls: string[] = [];
      if (imageFiles.length > 0) {
        const { uploadImages } = await import("@/lib/uploadImages");
        imageUrls = await uploadImages(imageFiles);
      }

      const { error } = await supabase.from("listings").insert({
        user_id: user.id,
        display_name: form.display_name,
        title: form.title,
        category: form.category,
        gender: form.gender,
        age: parseInt(form.age),
        location: form.location,
        country: form.country,
        region: form.region,
        city: form.location,
        about: form.about,
        services: form.services,
        languages: form.languages,
        rate_1hour: form.rate_1hour,
        rate_2hours: form.rate_2hours,
        rate_overnight: form.rate_overnight,
        rate_weekend: form.rate_weekend,
        phone: form.phone,
        whatsapp: form.whatsapp,
        telegram: form.telegram,
        snapchat: form.snapchat,
        email: form.email,
        images: imageUrls,
        profile_image: imageUrls[0] || null,
        height: form.height ? parseInt(form.height) : null,
        weight: form.weight ? parseInt(form.weight) : null,
        body_build: form.body_build || null,
        hair_color: form.hair_color || null,
        eye_color: form.eye_color || null,
        grooming: form.grooming || null,
        bra_size: form.bra_size || null,
        nationality: form.nationality || null,
        outcall: form.outcall,
        handicap_friendly: form.handicap_friendly,
        has_own_place: form.has_own_place,
        opening_hours: openingHours,
        timezone: timezone,
        voice_message_url: voiceMessageUrl || null,
        social_links: Object.keys(socialLinks).length > 0 ? socialLinks : null,
        payment_methods: paymentMethods,
        status: "pending",
      });
      if (error) throw error;
      setSuccess(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Noget gik galt. Prøv igen.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      display_name: "",
      title: "",
      category: "",
      gender: "",
      age: "",
      location: "",
      country: "",
      countryName: "",
      region: "",
      regionName: "",
      about: "",
      services: [],
      languages: [],
      rate_1hour: "",
      rate_2hours: "",
      rate_overnight: "",
      rate_weekend: "",
      phone: "",
      whatsapp: "",
      telegram: "",
      snapchat: "",
      email: "",
      height: "",
      weight: "",
      body_build: "",
      hair_color: "",
      eye_color: "",
      grooming: "",
      bra_size: "",
      nationality: "",
      outcall: false,
      handicap_friendly: false,
      has_own_place: false,
    });
    setImageFiles([]);
    setImagePreviews([]);
    setStep(1);
    setSuccess(false);
    setError("");
  };

  const steps = [
    { num: 1, label: "Basis info" },
    { num: 2, label: "Detaljer" },
    { num: 3, label: "Kontakt & Billeder" },
  ];

  if (redirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-7 h-7 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 py-10">
        <div className="mx-auto max-w-2xl px-4">
          <div className="rounded-2xl bg-white p-8 text-center shadow-md">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="mb-2 text-2xl font-bold text-gray-900">Din annonce er oprettet!</h2>
            <p className="mb-6 text-gray-500">
              Din annonce er sendt til godkendelse og vil v&aelig;re synlig inden for 24 timer.
            </p>
            <div className="flex gap-3">
              <a
                href="/dashboard/annoncer"
                className="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Se mine annoncer
              </a>
              <button
                onClick={resetForm}
                className="flex-1 rounded-xl bg-red-600 px-4 py-3 text-sm font-medium text-white hover:bg-red-700"
              >
                Opret ny annonce
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="mx-auto max-w-2xl px-4">
        {/* Progress Bar */}
        <div className="mb-8 flex items-center justify-center">
          {steps.map((s, i) => (
            <div key={s.num} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${
                    step > s.num
                      ? "bg-red-100 text-red-600"
                      : step === s.num
                        ? "bg-red-600 text-white"
                        : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {step > s.num ? (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    s.num
                  )}
                </div>
                <span className="mt-1 text-xs text-gray-500">{s.label}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={`mx-1.5 sm:mx-3 mb-5 h-0.5 w-8 sm:w-16 ${step > s.num ? "bg-red-300" : "bg-gray-200"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Form Card */}
        <div className="rounded-2xl bg-white p-8 shadow-md">
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
          )}

          {/* STEP 1 */}
          {step === 1 && (
            <div>
              <h2 className="mb-6 text-xl font-bold text-gray-900">Trin 1: Basis information</h2>

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
                  <label className="mb-1 block text-sm font-medium text-gray-700">Annonce titel</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => updateField("title", e.target.value)}
                    placeholder="F.eks. Sofia - Diskret escort i København"
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                </div>

                {/* Who are you? */}
                <div>
                  <label className="mb-2 block text-xs font-bold text-gray-700 uppercase tracking-wide">Who are you? *</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { gender: "female", category: "Escort",  label: GENDER_LABELS["female"]?.[locale] ?? "Woman",  emoji: "👩" },
                      { gender: "male",   category: "Escort",  label: GENDER_LABELS["male"]?.[locale] ?? "Man",      emoji: "👨" },
                      { gender: "trans",  category: "Escort",  label: GENDER_LABELS["trans"]?.[locale] ?? "Trans",    emoji: "⚧" },
                      { gender: "female", category: "Couples", label: "Couple", emoji: "👫" },
                    ].map(opt => {
                      const selected = form.gender === opt.gender && form.category === opt.category
                      return (
                        <button
                          key={opt.label}
                          type="button"
                          onClick={() => { updateField("gender", opt.gender); updateField("category", opt.category) }}
                          className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-xs font-bold transition ${
                            selected
                              ? "border-red-600 bg-red-50 text-red-600 border-2"
                              : "border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300"
                          }`}
                        >
                          <span className="text-xl">{opt.emoji}</span>
                          {opt.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Service type (category) */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Service type</label>
                  <select
                    value={form.category}
                    onChange={(e) => updateField("category", e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                  >
                    <option value="" disabled>
                      Vælg type
                    </option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Alder</label>
                  <input
                    type="number"
                    min={18}
                    max={99}
                    value={form.age}
                    onChange={(e) => updateField("age", e.target.value)}
                    placeholder="18"
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lokation <span className="text-red-500">*</span>
                  </label>
                  <LocationSelector
                    value={{
                      country: form.country,
                      countryName: form.countryName,
                      region: form.region,
                      regionName: form.regionName,
                      city: form.location,
                    }}
                    onChange={(val) => {
                      setForm(prev => ({
                        ...prev,
                        country: val.country,
                        countryName: val.countryName,
                        region: val.region,
                        regionName: val.regionName,
                        location: val.city,
                      }))
                    }}
                  />
                </div>
              </div>

              <button
                onClick={() => validateStep1() && setStep(2)}
                className="mt-6 w-full rounded-xl bg-red-600 py-3 text-sm font-medium text-white hover:bg-red-700"
              >
                Fortsæt →
              </button>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div>
              <h2 className="mb-6 text-xl font-bold text-gray-900">Trin 2: Om dig og dine services</h2>

              <div className="space-y-5">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Om mig</label>
                  <textarea
                    rows={5}
                    value={form.about}
                    onChange={(e) => updateField("about", e.target.value)}
                    placeholder="Beskriv dig selv og hvad du tilbyder..."
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Services</label>
                  <div className="flex flex-wrap gap-2">
                    {SERVICE_OPTIONS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => toggleArray("services", s)}
                        className={`rounded-full border px-4 py-1.5 text-sm transition ${
                          form.services.includes(s)
                            ? "border-red-300 bg-red-100 text-red-700"
                            : "border-gray-300 bg-white text-gray-600 hover:border-gray-400"
                        }`}
                      >
                        {SERVICE_LABELS[s]?.[locale] ?? s}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Sprog</label>
                  <div className="flex flex-wrap gap-2">
                    {LANGUAGE_OPTIONS.map((l) => (
                      <button
                        key={l}
                        type="button"
                        onClick={() => toggleArray("languages", l)}
                        className={`rounded-full border px-4 py-1.5 text-sm transition ${
                          form.languages.includes(l)
                            ? "border-red-300 bg-red-100 text-red-700"
                            : "border-gray-300 bg-white text-gray-600 hover:border-gray-400"
                        }`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">Priser</label>
                    <span className="text-[11px] text-gray-400 bg-gray-50 border border-gray-200 rounded-full px-2.5 py-1">Enter in USD — visitors see local currency</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="mb-1 block text-xs text-gray-500">1 time</span>
                      <input
                        type="text"
                        value={form.rate_1hour}
                        onChange={(e) => updateField("rate_1hour", e.target.value)}
                        placeholder="500 DKK"
                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                      />
                    </div>
                    <div>
                      <span className="mb-1 block text-xs text-gray-500">2 timer</span>
                      <input
                        type="text"
                        value={form.rate_2hours}
                        onChange={(e) => updateField("rate_2hours", e.target.value)}
                        placeholder="900 DKK"
                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                      />
                    </div>
                    <div>
                      <span className="mb-1 block text-xs text-gray-500">Overnat</span>
                      <input
                        type="text"
                        value={form.rate_overnight}
                        onChange={(e) => updateField("rate_overnight", e.target.value)}
                        placeholder="2.500 DKK"
                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                      />
                    </div>
                    <div>
                      <span className="mb-1 block text-xs text-gray-500">Weekend</span>
                      <input
                        type="text"
                        value={form.rate_weekend}
                        onChange={(e) => updateField("rate_weekend", e.target.value)}
                        placeholder="5.000 DKK"
                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Udseende & Detaljer */}
                <div>
                  <label className="mb-3 block text-sm font-semibold text-gray-900">Udseende & Detaljer</label>

                  {/* Højde / Vægt */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <span className="mb-1 block text-xs text-gray-500">Højde (cm)</span>
                      <input
                        type="number"
                        min={100}
                        max={250}
                        value={form.height}
                        onChange={(e) => updateField("height", e.target.value)}
                        placeholder="170"
                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                      />
                    </div>
                    <div>
                      <span className="mb-1 block text-xs text-gray-500">Vægt (kg)</span>
                      <input
                        type="number"
                        min={30}
                        max={200}
                        value={form.weight}
                        onChange={(e) => updateField("weight", e.target.value)}
                        placeholder="60"
                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                      />
                    </div>
                  </div>

                  {/* 2x2 selects */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <span className="mb-1 block text-xs text-gray-500">Kropsbygning</span>
                      <select
                        value={form.body_build}
                        onChange={(e) => updateField("body_build", e.target.value)}
                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                      >
                        <option value="">Vælg</option>
                        {BODY_BUILD_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                    <div>
                      <span className="mb-1 block text-xs text-gray-500">Hårfarve</span>
                      <select
                        value={form.hair_color}
                        onChange={(e) => updateField("hair_color", e.target.value)}
                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                      >
                        <option value="">Vælg</option>
                        {HAIR_COLOR_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                    <div>
                      <span className="mb-1 block text-xs text-gray-500">Øjenfarve</span>
                      <select
                        value={form.eye_color}
                        onChange={(e) => updateField("eye_color", e.target.value)}
                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                      >
                        <option value="">Vælg</option>
                        {EYE_COLOR_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                    <div>
                      <span className="mb-1 block text-xs text-gray-500">Intimbelshåring</span>
                      <select
                        value={form.grooming}
                        onChange={(e) => updateField("grooming", e.target.value)}
                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                      >
                        <option value="">Vælg</option>
                        {GROOMING_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* BH-størrelse */}
                  <div className="mb-3">
                    <span className="mb-1 block text-xs text-gray-500">BH-størrelse</span>
                    <select
                      value={form.bra_size}
                      onChange={(e) => updateField("bra_size", e.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                    >
                      <option value="">Vælg</option>
                      {BRA_SIZE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>

                  {/* Nationalitet */}
                  <div className="mb-3">
                    <span className="mb-1 block text-xs text-gray-500">Nationalitet</span>
                    <select
                      value={form.nationality}
                      onChange={(e) => updateField("nationality", e.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                    >
                      <option value="">Vælg</option>
                      {NATIONALITY_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>

                  {/* Checkboxes */}
                  <div className="flex flex-wrap gap-4 mt-2">
                    {[
                      { field: "outcall", label: "Kører escort" },
                      { field: "handicap_friendly", label: "Modtager handicappede" },
                      { field: "has_own_place", label: "Har eget sted" },
                    ].map((c) => (
                      <label key={c.field} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form[c.field as keyof typeof form] as boolean}
                          onChange={(e) => updateField(c.field, e.target.checked)}
                          className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                        />
                        {c.label}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 rounded-xl border border-gray-300 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  ← Tilbage
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 rounded-xl bg-red-600 py-3 text-sm font-medium text-white hover:bg-red-700"
                >
                  Fortsæt →
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div>
              <h2 className="mb-6 text-xl font-bold text-gray-900">Trin 3: Kontakt & billeder</h2>

              <div className="space-y-5">
                {/* Contact fields */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Kontakt</label>
                  <div className="space-y-3">
                    {[
                      { label: "Telefon",  field: "phone" },
                      { label: "WhatsApp", field: "whatsapp" },
                      { label: "Telegram", field: "telegram" },
                      { label: "Snapchat", field: "snapchat" },
                      { label: "Email",    field: "email" },
                    ].map((c) => (
                      <div key={c.field} className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-2.5">
                        <span className="w-4 h-4 rounded-sm bg-gray-200 flex-shrink-0" />
                        <span className="w-20 text-sm text-gray-500">{c.label}</span>
                        <input
                          type={c.field === "email" ? "email" : "text"}
                          value={form[c.field as keyof typeof form] as string}
                          onChange={(e) => updateField(c.field, e.target.value)}
                          placeholder={c.label}
                          className="flex-1 border-0 bg-transparent text-sm focus:outline-none focus:ring-0"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── PAYMENT METHODS ── */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Payment Methods</label>
                  <div className="flex flex-wrap gap-2">
                    {PAYMENT_OPTIONS.map(opt => {
                      const active = paymentMethods.includes(opt.id)
                      const Icon = opt.icon
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setPaymentMethods(prev => prev.includes(opt.id) ? prev.filter(m => m !== opt.id) : [...prev, opt.id])}
                          className={`flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                            active
                              ? "border-red-600 bg-red-600 text-white"
                              : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                          }`}
                        >
                          <Icon size={14} />
                          {opt.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* ── SOCIAL MEDIA LINKS ── */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-base font-bold text-gray-900">{t.social_media_links}</p>
                    {!["basic", "featured", "vip"].includes(userTier || "") && (
                      <span className="text-[11px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                        Låsning kræver premium
                      </span>
                    )}
                  </div>
                  <SocialLinksEditor
                    value={socialLinks}
                    onChange={setSocialLinks}
                    isPremium={["basic", "featured", "vip"].includes(userTier || "")}
                  />
                </div>

                {/* Image upload area */}
                {/* ── AVAILABILITY & OPENING HOURS ── */}
                <div>
                  <p className="text-base font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">{t.availability_hours}</p>

                  {/* Timezone */}
                  <div className="mb-4">
                    <label className="text-sm font-medium text-gray-700 block mb-1">{t.your_timezone}</label>
                    <select
                      value={timezone}
                      onChange={e => setTimezone(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-red-500 bg-white"
                    >
                      {TIMEZONE_OPTIONS.map(group => (
                        <optgroup key={group.group} label={group.group}>
                          {group.zones.map(tz => (
                            <option key={tz} value={tz}>{tz.replace(/_/g, " ").replace(/\//g, " / ")}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>

                  {/* Opening hours table */}
                  <div className="border border-gray-100 rounded-xl overflow-x-auto">
                    <div className="grid grid-cols-[80px_1fr_1fr_60px] sm:grid-cols-[120px_1fr_1fr_80px] gap-0 bg-gray-50 px-3 sm:px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100 min-w-[340px]">
                      <span>Day</span><span>Opens</span><span>Closes</span><span className="text-right">Closed</span>
                    </div>
                    {DAYS_OF_WEEK.map(day => {
                      const h = openingHours[day];
                      return (
                        <div key={day} className={`grid grid-cols-[80px_1fr_1fr_60px] sm:grid-cols-[120px_1fr_1fr_80px] items-center gap-2 px-3 sm:px-4 py-2.5 border-b border-gray-50 last:border-0 min-w-[340px] ${h.closed ? "bg-gray-50/60 opacity-60" : "bg-white"}`}>
                          <span className="text-sm font-medium text-gray-800">{DAY_LABELS[day]}</span>
                          <select
                            disabled={h.closed}
                            value={h.open}
                            onChange={e => setOpeningHours(prev => ({ ...prev, [day]: { ...prev[day], open: e.target.value } }))}
                            className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:border-red-400 disabled:bg-gray-100 disabled:text-gray-400"
                          >
                            {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                          <select
                            disabled={h.closed}
                            value={h.close}
                            onChange={e => setOpeningHours(prev => ({ ...prev, [day]: { ...prev[day], close: e.target.value } }))}
                            className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:border-red-400 disabled:bg-gray-100 disabled:text-gray-400"
                          >
                            {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => setOpeningHours(prev => ({ ...prev, [day]: { ...prev[day], closed: !prev[day].closed } }))}
                              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${h.closed ? "bg-gray-300" : "bg-red-500"}`}
                            >
                              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${h.closed ? "translate-x-0.5" : "translate-x-4"}`} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Toggle switches on the right to mark a day as closed</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Billeder <span className="text-gray-400">(max 20 &bull; JPG, PNG &bull; max 5MB/stk)</span>
                  </label>

                  {/* Drop zone */}
                  <div
                    className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-red-400 transition-colors"
                    onClick={() => document.getElementById("image-input")?.click()}
                  >
                    <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                    <p className="text-gray-500 text-sm font-medium">Klik for at uploade billeder</p>
                    <p className="text-xs text-gray-400 mt-1">Første billede bruges som profilbillede</p>
                    <input
                      id="image-input"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        const remaining = 20 - imageFiles.length;
                        const newFiles = files.slice(0, remaining);
                        setImageFiles(prev => [...prev, ...newFiles]);
                        newFiles.forEach(file => {
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            setImagePreviews(prev => [...prev, ev.target?.result as string]);
                          };
                          reader.readAsDataURL(file);
                        });
                      }}
                    />
                  </div>

                  {/* Preview thumbnails */}
                  {imagePreviews.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-4">
                      {imagePreviews.map((src, i) => (
                        <div key={i} className="relative group aspect-square">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={src}
                            alt={`preview ${i + 1}`}
                            className="w-full h-full object-cover rounded-xl"
                          />
                          {i === 0 && (
                            <span className="absolute top-1 left-1 bg-red-600 text-white text-xs px-1.5 py-0.5 rounded-md font-medium">
                              Profil
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setImageFiles(prev => prev.filter((_, idx) => idx !== i));
                              setImagePreviews(prev => prev.filter((_, idx) => idx !== i));
                            }}
                            className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {imageFiles.length > 0 && (
                    <p className="text-xs text-gray-500 mt-2">{imageFiles.length} billede{imageFiles.length !== 1 ? "r" : ""} valgt</p>
                  )}
                </div>

                {/* Preview */}
                <div className="rounded-xl bg-gray-50 p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-700">Forhåndsvisning</span>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p><span className="font-medium">Titel:</span> {form.title || "–"}</p>
                    <p><span className="font-medium">Kategori:</span> {form.category || "–"}</p>
                    <p><span className="font-medium">Køn:</span> {(GENDER_LABELS[form.gender]?.[locale] ?? form.gender) || "–"}</p>
                    <p><span className="font-medium">Alder:</span> {form.age || "–"}</p>
                    <p><span className="font-medium">Lokation:</span> {form.location || "–"}</p>
                    {form.about && (
                      <p>
                        <span className="font-medium">Om mig:</span>{" "}
                        {form.about.length > 100 ? form.about.slice(0, 100) + "..." : form.about}
                      </p>
                    )}
                    {form.services.length > 0 && (
                      <p><span className="font-medium">Services:</span> {form.services.length} valgt</p>
                    )}
                    {(form.rate_1hour || form.rate_2hours || form.rate_overnight || form.rate_weekend) && (
                      <p>
                        <span className="font-medium">Priser:</span>{" "}
                        {[form.rate_1hour, form.rate_2hours, form.rate_overnight, form.rate_weekend]
                          .filter(Boolean)
                          .join(" / ")}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Voice Message — Premium only */}
              <div className="mt-6 rounded-2xl border border-gray-200 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/></svg>
                  <h3 className="font-semibold text-gray-900 text-sm">{t.voice_message}</h3>
                  {!["premium", "featured", "vip"].includes(userTier || "") && (
                    <span className="ml-auto text-[11px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Premium only</span>
                  )}
                </div>
                {["premium", "featured", "vip"].includes(userTier || "") ? (
                  <VoiceRecorder
                    onUpload={(url) => setVoiceMessageUrl(url)}
                    existingUrl={voiceMessageUrl || null}
                  />
                ) : (
                  <div className="rounded-xl bg-gray-50 border border-dashed border-gray-200 p-4 text-center">
                    <p className="text-sm text-gray-400">Opgrader til Premium for at tilføje en voice message til din profil</p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="w-full sm:w-auto rounded-xl border border-gray-300 px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  ← Tilbage
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 py-3 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {loading && (
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  )}
                  Udgiv annonce
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
