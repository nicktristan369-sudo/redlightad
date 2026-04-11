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

const DIAL_CODES = [
  { code: "+45",  iso: "DK", name: "Denmark" },
  { code: "+46",  iso: "SE", name: "Sweden" },
  { code: "+47",  iso: "NO", name: "Norway" },
  { code: "+358", iso: "FI", name: "Finland" },
  { code: "+44",  iso: "GB", name: "United Kingdom" },
  { code: "+66",  iso: "TH", name: "Thailand" },
  { code: "+63",  iso: "PH", name: "Philippines" },
  { code: "+60",  iso: "MY", name: "Malaysia" },
  { code: "+62",  iso: "ID", name: "Indonesia" },
  { code: "+84",  iso: "VN", name: "Vietnam" },
  { code: "+856", iso: "LA", name: "Laos" },
  { code: "+855", iso: "KH", name: "Cambodia" },
  { code: "+95",  iso: "MM", name: "Myanmar" },
  { code: "+49",  iso: "DE", name: "Germany" },
  { code: "+33",  iso: "FR", name: "France" },
  { code: "+31",  iso: "NL", name: "Netherlands" },
  { code: "+34",  iso: "ES", name: "Spain" },
  { code: "+39",  iso: "IT", name: "Italy" },
  { code: "+48",  iso: "PL", name: "Poland" },
  { code: "+43",  iso: "AT", name: "Austria" },
  { code: "+32",  iso: "BE", name: "Belgium" },
  { code: "+41",  iso: "CH", name: "Switzerland" },
  { code: "+420", iso: "CZ", name: "Czech Republic" },
  { code: "+36",  iso: "HU", name: "Hungary" },
  { code: "+40",  iso: "RO", name: "Romania" },
  { code: "+30",  iso: "GR", name: "Greece" },
  { code: "+351", iso: "PT", name: "Portugal" },
  { code: "+380", iso: "UA", name: "Ukraine" },
  { code: "+7",   iso: "RU", name: "Russia" },
  { code: "+90",  iso: "TR", name: "Turkey" },
  { code: "+1",   iso: "US", name: "USA / Canada" },
  { code: "+61",  iso: "AU", name: "Australia" },
  { code: "+64",  iso: "NZ", name: "New Zealand" },
  { code: "+55",  iso: "BR", name: "Brazil" },
  { code: "+52",  iso: "MX", name: "Mexico" },
  { code: "+54",  iso: "AR", name: "Argentina" },
  { code: "+57",  iso: "CO", name: "Colombia" },
  { code: "+971", iso: "AE", name: "UAE" },
  { code: "+966", iso: "SA", name: "Saudi Arabia" },
  { code: "+974", iso: "QA", name: "Qatar" },
  { code: "+81",  iso: "JP", name: "Japan" },
  { code: "+82",  iso: "KR", name: "South Korea" },
  { code: "+86",  iso: "CN", name: "China" },
  { code: "+91",  iso: "IN", name: "India" },
  { code: "+92",  iso: "PK", name: "Pakistan" },
  { code: "+27",  iso: "ZA", name: "South Africa" },
  { code: "+20",  iso: "EG", name: "Egypt" },
  { code: "+234", iso: "NG", name: "Nigeria" },
  { code: "+254", iso: "KE", name: "Kenya" },
  { code: "+353", iso: "IE", name: "Ireland" },
  { code: "+372", iso: "EE", name: "Estonia" },
  { code: "+371", iso: "LV", name: "Latvia" },
  { code: "+370", iso: "LT", name: "Lithuania" },
  { code: "+421", iso: "SK", name: "Slovakia" },
  { code: "+386", iso: "SI", name: "Slovenia" },
  { code: "+385", iso: "HR", name: "Croatia" },
  { code: "+381", iso: "RS", name: "Serbia" },
  { code: "+359", iso: "BG", name: "Bulgaria" },
  { code: "+373", iso: "MD", name: "Moldova" },
];

// ── Custom dial code picker with square flags ──────────────────────────────
function DialCodePicker({ value, onChange }: { value: string; onChange: (code: string) => void }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const selected = DIAL_CODES.find(d => d.code === value) ?? DIAL_CODES[0]
  const filtered = DIAL_CODES.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) || d.code.includes(search)
  )
  return (
    <div style={{ position: "relative", userSelect: "none" }}>
      {/* Trigger button */}
      <button type="button" onClick={() => setOpen(o => !o)}
        style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", border: "1px solid #D1D5DB", borderRadius: 10, background: "#F9FAFB", cursor: "pointer", width: "100%", fontSize: 15, fontWeight: 600, color: "#111" }}>
        <span className={`fi fi-${selected.iso.toLowerCase()} fis`} style={{ borderRadius: 3, width: 20, height: 16, display: "inline-block", flexShrink: 0 }} />
        <span>{selected.code}</span>
        <span style={{ fontWeight: 400, color: "#6B7280", fontSize: 13 }}>{selected.name}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5" style={{ marginLeft: "auto" }}><polyline points="6 9 12 15 18 9"/></svg>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 999, background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", overflow: "hidden", maxHeight: 280 }}>
          {/* Search */}
          <div style={{ padding: "8px 10px", borderBottom: "1px solid #F3F4F6" }}>
            <input
              autoFocus
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search country..."
              style={{ width: "100%", fontSize: 14, padding: "6px 10px", border: "1px solid #E5E7EB", borderRadius: 8, outline: "none", boxSizing: "border-box" }}
            />
          </div>
          {/* Options */}
          <div style={{ overflowY: "auto", maxHeight: 210 }}>
            {filtered.map(d => (
              <button key={d.iso} type="button"
                onClick={() => { onChange(d.code); setOpen(false); setSearch(""); }}
                style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "9px 14px", border: "none", background: d.code === value ? "#FEF2F2" : "transparent", cursor: "pointer", fontSize: 14, color: "#111", textAlign: "left" }}>
                <span className={`fi fi-${d.iso.toLowerCase()} fis`} style={{ borderRadius: 3, width: 20, height: 16, display: "inline-block", flexShrink: 0 }} />
                <span style={{ fontWeight: 600, color: "#374151", minWidth: 40 }}>{d.code}</span>
                <span style={{ color: "#6B7280" }}>{d.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Click-away */}
      {open && <div style={{ position: "fixed", inset: 0, zIndex: 998 }} onClick={() => setOpen(false)} />}
    </div>
  )
}

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
  LANGUAGE_OPTIONS,
} from "@/lib/listingOptions";
import Link from "next/link";

// Comprehensive services list (alphabetically ordered)
const ALL_SERVICES = [
  "69 position",
  "Anal sex",
  "BDSM",
  "Bondage",
  "Casual photos",
  "Classic vaginal sex",
  "Couples",
  "Cum in face",
  "Cum in mouth",
  "Cum on body",
  "Cunnilingus",
  "Deepthroat",
  "Dinner dates",
  "Dirty talk",
  "Domination",
  "Double penetration anal",
  "Double penetration vaginal",
  "Duo with girl",
  "Erotic massage",
  "Erotic photos (during the meeting)",
  "Extraball",
  "Facesitting",
  "Findom",
  "Fingering",
  "Fisting",
  "Foot fetish",
  "French kissing",
  "Girlfriend experience (GFE)",
  "Golden shower (give)",
  "Golden shower (receive)",
  "Group sex",
  "Handjob",
  "Kamasutra",
  "Kissing",
  "Massage",
  "Masturbation",
  "Oral sex",
  "Oral sex (blowjob)",
  "Oral without condom",
  "Private meetings",
  "PSE (Porn star experience)",
  "Role play",
  "Social events",
  "Squirting",
  "Striptease",
  "Submission",
  "Swallowing",
  "Tantric massage",
  "Toys",
  "Travel companion",
  "Uniforms/Costumes",
  "Video recording",
  "Video recording (during meeting)",
  "Weekend getaways",
  "With 2 men",
];

const MOST_COMMON_SERVICES = [
  "Oral sex",
  "Classic vaginal sex",
  "Anal sex",
  "69 position",
  "Kissing",
  "Massage",
  "Striptease",
  "Girlfriend experience (GFE)",
  "Casual photos",
  "Dinner dates",
  "Travel companion",
  "Social events",
  "Weekend getaways",
  "Private meetings",
];

const OTHER_SERVICES = ALL_SERVICES.filter(s => !MOST_COMMON_SERVICES.includes(s));

type ServiceEntry = { name: string; included: "" | "included" | "extra"; price: string };

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

// Helper: cm to feet/inches
function cmToFt(cm: number): string {
  const totalInches = Math.round(cm / 2.54);
  return `${Math.floor(totalInches / 12)}'${totalInches % 12}"`;
}

// Helper: kg to lbs
function kgToLbs(kg: number): number {
  return Math.round(kg * 2.20462);
}

// Additional dropdowns data
const ETHNICITY_OPTIONS = ["Asian", "Black", "Caucasian", "Indian", "Latin", "Middle Eastern", "Mixed", "Other"];
const HAIR_LENGTH_OPTIONS = ["Bald", "Short", "Medium", "Long", "Very long"];
const BREAST_TYPE_OPTIONS = ["Natural", "Silicone"];
const ORIENTATION_OPTIONS = ["Straight", "Bisexual", "Lesbian", "Gay"];
const PUBIC_HAIR_OPTIONS = ["Shaved completely", "Trimmed", "Natural", "Brazilian", "Landing strip"];
const SMOKER_OPTIONS = ["No", "Yes - occasionally", "Yes - regularly"];
const TATTOO_OPTIONS = ["No", "Small", "Large", "Multiple"];
const PIERCING_OPTIONS = ["No", "Yes - discrete", "Yes - visible"];

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
        alert("You already have a profile. Edit it here.");
        router.replace(`/dashboard/annoncer/${listing.id}/edit`);
        return;
      }
      setRedirecting(false);
    };
    checkExisting();
  }, [router]);
  const [success, setSuccess] = useState(false);
  const [createdListingId, setCreatedListingId] = useState<string | null>(null);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [verifyCode, setVerifyCode] = useState("");
  const [showVerifyInput, setShowVerifyInput] = useState(false);
  const [verifySending, setVerifySending] = useState(false);
  const [verifyChecking, setVerifyChecking] = useState(false);
  const [verifyError, setVerifyError] = useState("");
  const [dialCode, setDialCode] = useState("+45");
  const [phoneLocal, setPhoneLocal] = useState("");
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

  const [serviceEntries, setServiceEntries] = useState<ServiceEntry[]>([]);

  // Initialize service entries on mount
  useEffect(() => {
    const entries: ServiceEntry[] = [
      ...MOST_COMMON_SERVICES.map(name => ({ name, included: "" as const, price: "" })),
      ...OTHER_SERVICES.map(name => ({ name, included: "" as const, price: "" })),
    ];
    setServiceEntries(entries);
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
    rate_30min: "",
    rate_1hour: "",
    rate_2hours: "",
    rate_3hours: "",
    rate_6hours: "",
    rate_12hours: "",
    rate_24hours: "",
    rate_48hours: "",
    phone: "",
    whatsapp: "",
    telegram: "",
    snapchat: "",
    email: "",
    height_cm: "",
    weight_kg: "",
    body_build: "",
    hair_color: "",
    hair_length: "",
    eye_color: "",
    grooming: "",
    bra_size: "",
    breast_type: "",
    nationality: "",
    ethnicity: "",
    orientation: "",
    pubic_hair: "",
    smoker: "",
    tattoo: "",
    piercing: "",
    available_for: "",
    meeting_with: "",
    travel: "",
    pornstar: "No",
    pornstar_verification: "",
    handicap_friendly: false,
    has_own_place: false,
    show_phone: false,
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
    if (!form.display_name || !form.category || !form.gender || !form.country || !form.languages[0]) {
      setError("Please fill in all required fields.");
      return false;
    }
    setError("");
    return true;
  };

  const [verifyChannel, setVerifyChannel] = useState<"sms" | "whatsapp">("whatsapp")

  const sendPhoneVerification = async (channel: "sms" | "whatsapp" = verifyChannel) => {
    if (!form.phone || form.phone.trim().length < 8) {
      setVerifyError("Enter a valid phone number first.")
      return
    }
    setVerifySending(true)
    setVerifyError("")
    try {
      const res = await fetch("/api/auth/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: form.phone, channel }),
      })
      const d = await res.json()
      if (d.ok) { setShowVerifyInput(true) }
      else { setVerifyError(d.error || "Failed to send code.") }
    } catch { setVerifyError("Network error.") }
    setVerifySending(false)
  }

  const confirmPhoneCode = async () => {
    if (!verifyCode || verifyCode.length < 4) return
    setVerifyChecking(true)
    setVerifyError("")
    try {
      const res = await fetch("/api/auth/verify-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: form.phone, code: verifyCode }),
      })
      const d = await res.json()
      if (d.success) {
        setPhoneVerified(true)
        setShowVerifyInput(false)
        setVerifyError("")
      } else { setVerifyError(d.error || "Incorrect code.") }
    } catch { setVerifyError("Network error.") }
    setVerifyChecking(false)
  }

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    // Step 3 validations
    if (imageFiles.length < 3) {
      setError("Please upload at least 3 photos to continue.")
      setLoading(false)
      return
    }
    if (!form.phone || form.phone.trim().length < 8) {
      setError("A valid phone number is required.")
      setLoading(false)
      return
    }
    if (!form.about || form.about.trim().length < 50) {
      setError("Please write at least 50 characters in your bio (About me).")
      setLoading(false)
      return
    }
    // Phone verification is optional — do not block submission

    // Map serviceEntries to services array
    const mappedServices = serviceEntries
      .filter(s => s.included !== "")
      .map(s => s.included === "included" ? s.name : `${s.name} (+€${s.price})`);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("You must be logged in to create a listing");

      // Upload images
      let imageUrls: string[] = [];
      if (imageFiles.length > 0) {
        const { uploadImages } = await import("@/lib/uploadImages");
        imageUrls = await uploadImages(imageFiles);
      }

      const { data: insertedData, error } = await supabase.from("listings").insert({
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
        services: mappedServices,
        languages: form.languages,
        rate_30min: form.rate_30min || null,
        rate_1hour: form.rate_1hour || null,
        rate_2hours: form.rate_2hours || null,
        rate_3hours: form.rate_3hours || null,
        rate_6hours: form.rate_6hours || null,
        rate_12hours: form.rate_12hours || null,
        rate_24hours: form.rate_24hours || null,
        rate_48hours: form.rate_48hours || null,
        phone: form.phone,
        whatsapp: form.whatsapp,
        telegram: form.telegram,
        snapchat: form.snapchat,
        email: form.email,
        images: imageUrls,
        profile_image: imageUrls[0] || null,
        height: form.height_cm ? parseInt(form.height_cm) : null,
        weight: form.weight_kg ? parseInt(form.weight_kg) : null,
        body_build: form.body_build || null,
        hair_color: form.hair_color || null,
        hair_length: form.hair_length || null,
        eye_color: form.eye_color || null,
        grooming: form.grooming || null,
        pubic_hair: form.pubic_hair || null,
        bra_size: form.bra_size || null,
        breast_type: form.breast_type || null,
        nationality: form.nationality || null,
        ethnicity: form.ethnicity || null,
        orientation: form.orientation || null,
        smoker: form.smoker || null,
        tattoo: form.tattoo || null,
        piercing: form.piercing || null,
        available_for: form.available_for || null,
        meeting_with: form.meeting_with || null,
        travel: form.travel || null,
        pornstar: form.pornstar === "Yes",
        pornstar_verification: form.pornstar === "Yes" ? form.pornstar_verification : null,
        incall: form.available_for === "Incall" || form.available_for === "Outcall + Incall",
        outcall: form.available_for === "Outcall" || form.available_for === "Outcall + Incall",
        handicap_friendly: form.handicap_friendly,
        has_own_place: form.has_own_place,
        opening_hours: openingHours,
        timezone: timezone,
        voice_message_url: voiceMessageUrl || null,
        social_links: Object.keys(socialLinks).length > 0 ? socialLinks : null,
        payment_methods: paymentMethods,
        status: "pending",
      }).select("id").single();
      if (error) throw error;
      if (insertedData?.id) setCreatedListingId(insertedData.id);
      setSuccess(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
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
      rate_30min: "",
      rate_1hour: "",
      rate_2hours: "",
      rate_3hours: "",
      rate_6hours: "",
      rate_12hours: "",
      rate_24hours: "",
      rate_48hours: "",
      phone: "",
      whatsapp: "",
      telegram: "",
      snapchat: "",
      email: "",
      height_cm: "",
      weight_kg: "",
      body_build: "",
      hair_color: "",
      hair_length: "",
      eye_color: "",
      grooming: "",
      bra_size: "",
      breast_type: "",
      nationality: "",
      ethnicity: "",
      orientation: "",
      pubic_hair: "",
      smoker: "",
      tattoo: "",
      piercing: "",
      available_for: "",
      meeting_with: "",
      travel: "",
      pornstar: "No",
      pornstar_verification: "",
      handicap_friendly: false,
      has_own_place: false,
      show_phone: false,
    });
    setImageFiles([]);
    setImagePreviews([]);
    setStep(1);
    setSuccess(false);
    setError("");
  };

  const steps = [
    { num: 1, label: "Basic Info" },
    { num: 2, label: "Details" },
    { num: 3, label: "Contact & Photos" },
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
            <h2 className="mb-2 text-2xl font-bold text-gray-900">Your listing has been created!</h2>
            <p className="mb-6 text-gray-500">
              Your listing has been submitted for review and will be visible within 24 hours.
            </p>
            <div className="flex gap-3 justify-center">
              <Link href={`/ads/${createdListingId || ""}`}
                className="px-8 py-3 rounded-xl text-[14px] font-bold bg-gray-900 text-white hover:bg-black">
                View my profile
              </Link>
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
              <h2 className="mb-6 text-xl font-bold text-gray-900">Step 1: Basic information</h2>

              <div className="space-y-5">
                {/* Navn */}
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>
                    Your name <span style={{ color: "#DC2626" }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="E.g. Sofia, Anna, Maria..."
                    value={form.display_name ?? ""}
                    onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))}
                    style={{ width: "100%", padding: "10px 14px", border: "1px solid #D1D5DB", borderRadius: 8, fontSize: 16, outline: "none", boxSizing: "border-box" }}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Listing title</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => updateField("title", e.target.value)}
                    placeholder="E.g. Sofia - Discreet escort in Copenhagen"
                    style={{ fontSize: 16 }}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                </div>

                {/* Who are you? */}
                <div>
                  <label className="mb-2 block text-xs font-bold text-gray-700 uppercase tracking-wide">
                    Who are you? <span style={{ color: "#DC2626" }}>*</span>
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { gender: "female", category: "Escort",  label: GENDER_LABELS["female"]?.[locale] ?? "Woman" },
                      { gender: "male",   category: "Escort",  label: GENDER_LABELS["male"]?.[locale] ?? "Man" },
                      { gender: "trans",  category: "Escort",  label: GENDER_LABELS["trans"]?.[locale] ?? "Trans" },
                      { gender: "female", category: "Couples", label: "Couple" },
                    ].map(opt => {
                      const selected = form.gender === opt.gender && form.category === opt.category
                      return (
                        <button
                          key={opt.label}
                          type="button"
                          onClick={() => { updateField("gender", opt.gender); updateField("category", opt.category) }}
                          className={`flex items-center justify-center rounded-xl border py-3 px-2 text-sm font-semibold transition ${
                            selected
                              ? "border-red-600 bg-red-50 text-red-600 border-2"
                              : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          {opt.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Service type (category) */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Service type <span style={{ color: "#DC2626" }}>*</span>
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => updateField("category", e.target.value)}
                    style={{ fontSize: 16 }}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                  >
                    <option value="" disabled>
                      Select type
                    </option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location <span className="text-red-500">*</span>
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

                {/* Languages */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Languages <span className="text-red-500">*</span>
                    <span className="ml-2 text-xs font-normal text-gray-400">Select up to 3</span>
                  </label>
                  <div className="flex flex-col gap-2">
                    {[0, 1, 2].map((idx) => {
                      const selected = form.languages[idx] || ""
                      const prevFilled = idx === 0 || !!form.languages[idx - 1]
                      if (!prevFilled) return null
                      const available = LANGUAGE_OPTIONS.filter(
                        l => !form.languages.includes(l) || l === selected
                      )
                      return (
                        <div key={idx} className="relative">
                          <select
                            value={selected}
                            onChange={e => {
                              const val = e.target.value
                              setForm(prev => {
                                const langs = [...prev.languages]
                                if (val === "") {
                                  langs.splice(idx, langs.length - idx)
                                } else {
                                  langs[idx] = val
                                }
                                return { ...prev, languages: langs.slice(0, 3) }
                              })
                            }}
                            style={{ fontSize: 16 }}
                            className={`w-full rounded-xl border px-4 py-2.5 text-sm appearance-none focus:outline-none focus:ring-1 focus:ring-red-500 ${
                              selected
                                ? "border-red-300 bg-red-50 text-red-700 font-medium"
                                : "border-gray-200 bg-white text-gray-500"
                            }`}
                          >
                            <option value="">{idx === 0 ? "Select language (required)" : `Add language ${idx + 1} (optional)`}</option>
                            {available.map(l => (
                              <option key={l} value={l}>{l}</option>
                            ))}
                          </select>
                          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                          </div>
                          {selected && (
                            <button
                              type="button"
                              onClick={() => setForm(prev => {
                                const langs = [...prev.languages]
                                langs.splice(idx, langs.length - idx)
                                return { ...prev, languages: langs }
                              })}
                              className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 text-lg leading-none"
                              title="Remove"
                            >×</button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Timezone */}
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">
                    Your timezone <span style={{ color: "#DC2626" }}>*</span>
                  </label>
                  <select
                    value={timezone}
                    onChange={e => setTimezone(e.target.value)}
                    style={{ fontSize: 16 }}
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
              </div>

              <button
                onClick={() => validateStep1() && setStep(2)}
                className="mt-6 w-full rounded-xl bg-red-600 py-3 text-sm font-medium text-white hover:bg-red-700"
              >
                Continue
              </button>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div>
              <h2 className="mb-6 text-xl font-bold text-gray-900">Step 2: About you and your services</h2>

              <div className="space-y-5">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">About me</label>
                  <textarea
                    rows={5}
                    value={form.about}
                    onChange={(e) => updateField("about", e.target.value)}
                    placeholder="Describe yourself and what you offer..."
                    style={{ fontSize: 16 }}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                  <p style={{ fontSize: 11, color: "#92400E", background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 6, padding: "6px 10px", marginTop: 6 }}>
                    ⚠️ NOT ALLOWED in description: phone numbers, email addresses, website URLs, social media (FB, IG, TikTok) or OnlyFans links.
                  </p>
                </div>

                {/* Services Table */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Services</label>
                  
                  {/* Most Common Services */}
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Most Common Services</p>
                    <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8, overflow: "hidden" }}>
                      {/* Header */}
                      <div style={{ display: "grid", gridTemplateColumns: "30px 1fr 120px 120px", gap: 8, background: "#F9FAFB", padding: "10px 12px", borderBottom: "1px solid #E5E7EB", fontSize: 12, fontWeight: 600, color: "#6B7280" }}>
                        <span></span>
                        <span>Service</span>
                        <span>Included</span>
                        <span>Extra price</span>
                      </div>
                      {/* Rows */}
                      {serviceEntries.filter(s => MOST_COMMON_SERVICES.includes(s.name)).map((service, idx) => {
                        const isActive = service.included !== "";
                        return (
                          <div
                            key={service.name}
                            style={{
                              display: "grid",
                              gridTemplateColumns: "30px 1fr 120px 120px",
                              gap: 8,
                              padding: "8px 12px",
                              alignItems: "center",
                              borderBottom: "1px solid #F3F4F6",
                              background: idx % 2 === 0 ? "#fff" : "#FAFAFA",
                              opacity: isActive ? 1 : 0.5,
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isActive}
                              onChange={e => {
                                setServiceEntries(prev => prev.map(s =>
                                  s.name === service.name
                                    ? { ...s, included: e.target.checked ? "included" : "", price: "" }
                                    : s
                                ))
                              }}
                              className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                            />
                            <span style={{ fontSize: 14, color: "#374151" }}>{service.name}</span>
                            <select
                              disabled={!isActive}
                              value={service.included}
                              onChange={e => {
                                setServiceEntries(prev => prev.map(s =>
                                  s.name === service.name
                                    ? { ...s, included: e.target.value as "" | "included" | "extra", price: e.target.value === "included" ? "" : s.price }
                                    : s
                                ))
                              }}
                              style={{ fontSize: 13, padding: "4px 8px", borderRadius: 6, border: "1px solid #D1D5DB" }}
                              className="disabled:bg-gray-100 disabled:text-gray-400"
                            >
                              <option value="">Choose</option>
                              <option value="included">Included</option>
                              <option value="extra">Extra</option>
                            </select>
                            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              <input
                                type="text"
                                disabled={!isActive || service.included !== "extra"}
                                value={service.price}
                                onChange={e => {
                                  setServiceEntries(prev => prev.map(s =>
                                    s.name === service.name ? { ...s, price: e.target.value } : s
                                  ))
                                }}
                                placeholder="50"
                                style={{ fontSize: 13, padding: "4px 8px", borderRadius: 6, border: "1px solid #D1D5DB", width: "100%" }}
                                className="disabled:bg-gray-100 disabled:text-gray-400"
                              />
                              <span style={{ fontSize: 13, color: "#6B7280", whiteSpace: "nowrap" }}>EUR</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Other Services */}
                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Other Services</p>
                    <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8, overflow: "hidden" }}>
                      {/* Header */}
                      <div style={{ display: "grid", gridTemplateColumns: "30px 1fr 120px 120px", gap: 8, background: "#F9FAFB", padding: "10px 12px", borderBottom: "1px solid #E5E7EB", fontSize: 12, fontWeight: 600, color: "#6B7280" }}>
                        <span></span>
                        <span>Service</span>
                        <span>Included</span>
                        <span>Extra price</span>
                      </div>
                      {/* Rows */}
                      {serviceEntries.filter(s => OTHER_SERVICES.includes(s.name)).map((service, idx) => {
                        const isActive = service.included !== "";
                        return (
                          <div
                            key={service.name}
                            style={{
                              display: "grid",
                              gridTemplateColumns: "30px 1fr 120px 120px",
                              gap: 8,
                              padding: "8px 12px",
                              alignItems: "center",
                              borderBottom: "1px solid #F3F4F6",
                              background: idx % 2 === 0 ? "#fff" : "#FAFAFA",
                              opacity: isActive ? 1 : 0.5,
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isActive}
                              onChange={e => {
                                setServiceEntries(prev => prev.map(s =>
                                  s.name === service.name
                                    ? { ...s, included: e.target.checked ? "included" : "", price: "" }
                                    : s
                                ))
                              }}
                              className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                            />
                            <span style={{ fontSize: 14, color: "#374151" }}>{service.name}</span>
                            <select
                              disabled={!isActive}
                              value={service.included}
                              onChange={e => {
                                setServiceEntries(prev => prev.map(s =>
                                  s.name === service.name
                                    ? { ...s, included: e.target.value as "" | "included" | "extra", price: e.target.value === "included" ? "" : s.price }
                                    : s
                                ))
                              }}
                              style={{ fontSize: 13, padding: "4px 8px", borderRadius: 6, border: "1px solid #D1D5DB" }}
                              className="disabled:bg-gray-100 disabled:text-gray-400"
                            >
                              <option value="">Choose</option>
                              <option value="included">Included</option>
                              <option value="extra">Extra</option>
                            </select>
                            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              <input
                                type="text"
                                disabled={!isActive || service.included !== "extra"}
                                value={service.price}
                                onChange={e => {
                                  setServiceEntries(prev => prev.map(s =>
                                    s.name === service.name ? { ...s, price: e.target.value } : s
                                  ))
                                }}
                                placeholder="50"
                                style={{ fontSize: 13, padding: "4px 8px", borderRadius: 6, border: "1px solid #D1D5DB", width: "100%" }}
                                className="disabled:bg-gray-100 disabled:text-gray-400"
                              />
                              <span style={{ fontSize: 13, color: "#6B7280", whiteSpace: "nowrap" }}>EUR</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Rates Table */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">Rates</label>
                    <span className="text-[11px] text-gray-400 bg-gray-50 border border-gray-200 rounded-full px-2.5 py-1">Enter in EUR</span>
                  </div>
                  <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 8, overflow: "hidden" }}>
                    {/* Header */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, background: "#F9FAFB", padding: "10px 14px", borderBottom: "1px solid #E5E7EB", fontSize: 12, fontWeight: 600, color: "#6B7280" }}>
                      <span>Time</span>
                      <span>Rate (EUR)</span>
                    </div>
                    {/* Rows */}
                    {[
                      { label: "30 minutes", field: "rate_30min" },
                      { label: "1 hour", field: "rate_1hour" },
                      { label: "2 hours", field: "rate_2hours" },
                      { label: "3 hours", field: "rate_3hours" },
                      { label: "6 hours", field: "rate_6hours" },
                      { label: "12 hours", field: "rate_12hours" },
                      { label: "24 hours", field: "rate_24hours" },
                      { label: "48 hours", field: "rate_48hours" },
                    ].map((row, idx) => (
                      <div
                        key={row.field}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: 12,
                          padding: "8px 14px",
                          alignItems: "center",
                          borderBottom: idx < 7 ? "1px solid #F3F4F6" : "none",
                          background: idx % 2 === 0 ? "#fff" : "#FAFAFA",
                        }}
                      >
                        <span style={{ fontSize: 14, color: "#374151" }}>{row.label}</span>
                        <input
                          type="text"
                          value={form[row.field as keyof typeof form] as string}
                          onChange={e => updateField(row.field, e.target.value)}
                          placeholder="e.g. 200"
                          style={{ fontSize: 16, padding: "6px 10px", borderRadius: 6, border: "1px solid #D1D5DB", width: "100%" }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Physical Attributes */}
                <div>
                  <label className="mb-3 block text-sm font-semibold text-gray-900">Physical Attributes</label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Age */}
                    <div>
                      <span className="mb-1 block text-xs text-gray-500">
                        Age <span style={{ color: "#DC2626" }}>*</span>
                      </span>
                      <input
                        type="number"
                        required
                        min={18}
                        max={99}
                        placeholder="18"
                        value={form.age ?? ""}
                        onChange={e => setForm(f => ({ ...f, age: e.target.value }))}
                        style={{ width: "100%", padding: "8px 12px", border: "1px solid #D1D5DB", borderRadius: 8, fontSize: 16, outline: "none" }}
                      />
                    </div>

                    {/* Height */}
                    <div>
                      <span className="mb-1 block text-xs text-gray-500">
                        Height <span style={{ color: "#DC2626" }}>*</span>
                      </span>
                      <select
                        value={form.height_cm}
                        onChange={e => updateField("height_cm", e.target.value)}
                        style={{ fontSize: 16 }}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
                      >
                        <option value="">Select height</option>
                        {Array.from({ length: 66 }, (_, i) => 145 + i).map(cm => (
                          <option key={cm} value={cm}>{cm} cm / {cmToFt(cm)}</option>
                        ))}
                      </select>
                    </div>

                    {/* Weight */}
                    <div>
                      <span className="mb-1 block text-xs text-gray-500">Weight</span>
                      <select
                        value={form.weight_kg}
                        onChange={e => updateField("weight_kg", e.target.value)}
                        style={{ fontSize: 16 }}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
                      >
                        <option value="">Select weight</option>
                        {Array.from({ length: 81 }, (_, i) => 40 + i).map(kg => (
                          <option key={kg} value={kg}>{kg} kg / {kgToLbs(kg)} lbs</option>
                        ))}
                      </select>
                    </div>

                    {/* Ethnicity */}
                    <div>
                      <span className="mb-1 block text-xs text-gray-500">Ethnicity</span>
                      <select
                        value={form.ethnicity}
                        onChange={e => updateField("ethnicity", e.target.value)}
                        style={{ fontSize: 16 }}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
                      >
                        <option value="">Select</option>
                        {ETHNICITY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>

                    {/* Hair color */}
                    <div>
                      <span className="mb-1 block text-xs text-gray-500">Hair color</span>
                      <select
                        value={form.hair_color}
                        onChange={e => updateField("hair_color", e.target.value)}
                        style={{ fontSize: 16 }}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
                      >
                        <option value="">Select</option>
                        {HAIR_COLOR_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>

                    {/* Hair length */}
                    <div>
                      <span className="mb-1 block text-xs text-gray-500">Hair length</span>
                      <select
                        value={form.hair_length}
                        onChange={e => updateField("hair_length", e.target.value)}
                        style={{ fontSize: 16 }}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
                      >
                        <option value="">Select</option>
                        {HAIR_LENGTH_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>

                    {/* Breast size */}
                    <div>
                      <span className="mb-1 block text-xs text-gray-500">Breast size</span>
                      <select
                        value={form.bra_size}
                        onChange={e => updateField("bra_size", e.target.value)}
                        style={{ fontSize: 16 }}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
                      >
                        <option value="">Select</option>
                        {BRA_SIZE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>

                    {/* Breast type */}
                    <div>
                      <span className="mb-1 block text-xs text-gray-500">Breast type</span>
                      <select
                        value={form.breast_type}
                        onChange={e => updateField("breast_type", e.target.value)}
                        style={{ fontSize: 16 }}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
                      >
                        <option value="">Select</option>
                        {BREAST_TYPE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>

                    {/* Nationality */}
                    <div>
                      <span className="mb-1 block text-xs text-gray-500">
                        Nationality <span style={{ color: "#DC2626" }}>*</span>
                      </span>
                      <select
                        value={form.nationality}
                        onChange={e => updateField("nationality", e.target.value)}
                        style={{ fontSize: 16 }}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
                      >
                        <option value="">Select</option>
                        {NATIONALITY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>

                    {/* Eye color */}
                    <div>
                      <span className="mb-1 block text-xs text-gray-500">Eye color</span>
                      <select
                        value={form.eye_color}
                        onChange={e => updateField("eye_color", e.target.value)}
                        style={{ fontSize: 16 }}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
                      >
                        <option value="">Select</option>
                        {EYE_COLOR_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>

                    {/* Orientation */}
                    <div>
                      <span className="mb-1 block text-xs text-gray-500">Orientation</span>
                      <select
                        value={form.orientation}
                        onChange={e => updateField("orientation", e.target.value)}
                        style={{ fontSize: 16 }}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
                      >
                        <option value="">Select</option>
                        {ORIENTATION_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>

                    {/* Pubic hair */}
                    <div>
                      <span className="mb-1 block text-xs text-gray-500">Pubic hair</span>
                      <select
                        value={form.pubic_hair}
                        onChange={e => updateField("pubic_hair", e.target.value)}
                        style={{ fontSize: 16 }}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
                      >
                        <option value="">Select</option>
                        {PUBIC_HAIR_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>

                    {/* Smoker */}
                    <div>
                      <span className="mb-1 block text-xs text-gray-500">Smoker</span>
                      <select
                        value={form.smoker}
                        onChange={e => updateField("smoker", e.target.value)}
                        style={{ fontSize: 16 }}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
                      >
                        <option value="">Select</option>
                        {SMOKER_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>

                    {/* Tattoo */}
                    <div>
                      <span className="mb-1 block text-xs text-gray-500">Tattoo</span>
                      <select
                        value={form.tattoo}
                        onChange={e => updateField("tattoo", e.target.value)}
                        style={{ fontSize: 16 }}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
                      >
                        <option value="">Select</option>
                        {TATTOO_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>

                    {/* Piercing */}
                    <div>
                      <span className="mb-1 block text-xs text-gray-500">Piercing</span>
                      <select
                        value={form.piercing}
                        onChange={e => updateField("piercing", e.target.value)}
                        style={{ fontSize: 16 }}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
                      >
                        <option value="">Select</option>
                        {PIERCING_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Available for */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Available for <span style={{ color: "#DC2626" }}>*</span>
                  </label>
                  <select
                    value={form.available_for}
                    onChange={e => updateField("available_for", e.target.value)}
                    style={{ fontSize: 16 }}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                  >
                    <option value="">Choose</option>
                    <option value="Outcall">Outcall</option>
                    <option value="Incall">Incall</option>
                    <option value="Outcall + Incall">Outcall + Incall</option>
                  </select>
                </div>

                {/* Meeting with */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Meeting with</label>
                  <select
                    value={form.meeting_with}
                    onChange={e => updateField("meeting_with", e.target.value)}
                    style={{ fontSize: 16 }}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                  >
                    <option value="">Choose</option>
                    <option value="Men">Men</option>
                    <option value="Women">Women</option>
                    <option value="Couples">Couples</option>
                    <option value="Men + Women">Men + Women</option>
                    <option value="All">All</option>
                  </select>
                </div>

                {/* Travel */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Travel</label>
                  <select
                    value={form.travel}
                    onChange={e => updateField("travel", e.target.value)}
                    style={{ fontSize: 16 }}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                  >
                    <option value="">Choose</option>
                    <option value="No">No</option>
                    <option value="Countrywide">Countrywide</option>
                    <option value="Europe">Europe</option>
                    <option value="Worldwide">Worldwide</option>
                  </select>
                </div>

                {/* Pornstar */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Are you a pornstar?</label>
                  <select
                    value={form.pornstar}
                    onChange={e => updateField("pornstar", e.target.value)}
                    style={{ fontSize: 16 }}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                  {form.pornstar === "Yes" && (
                    <div className="mt-3">
                      <span className="mb-1 block text-xs text-gray-500">Verify pornstar</span>
                      <textarea
                        rows={3}
                        value={form.pornstar_verification}
                        onChange={e => updateField("pornstar_verification", e.target.value)}
                        placeholder="- professional name (stage name)&#10;- link to your videos"
                        style={{ fontSize: 16 }}
                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                      />
                    </div>
                  )}
                </div>

                {/* Checkboxes */}
                <div className="flex flex-wrap gap-4 mt-2">
                  {[
                    { field: "handicap_friendly", label: "Disability friendly" },
                    { field: "has_own_place", label: "Has own place" },
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

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 rounded-xl border border-gray-300 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  ← Back
                </button>
                <button
                  onClick={() => {
                    if (!form.age || parseInt(form.age) < 18) {
                      setError("Please enter your age (minimum 18).");
                      return;
                    }
                    setError("");
                    setStep(3);
                  }}
                  className="flex-1 rounded-xl bg-red-600 py-3 text-sm font-medium text-white hover:bg-red-700"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div>
              <h2 className="mb-6 text-xl font-bold text-gray-900">Step 3: Contact & Photos</h2>

              <div className="space-y-5">
                {/* Contact fields */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Contact</label>
                  <div className="space-y-3">
                    {/* Phone with country code picker */}
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-gray-500">Phone number</label>
                      <DialCodePicker
                        value={dialCode}
                        onChange={code => {
                          setDialCode(code)
                          updateField("phone", code + phoneLocal.replace(/\s/g, ""))
                        }}
                      />
                      <div style={{ marginTop: 8 }}>
                        <input
                          type="tel"
                          value={phoneLocal}
                          onChange={e => {
                            const val = e.target.value.replace(/[^\d\s\-]/g, "")
                            setPhoneLocal(val)
                            updateField("phone", dialCode + val.replace(/\s/g, ""))
                            setPhoneVerified(false)
                            setShowVerifyInput(false)
                          }}
                          placeholder="12 34 56 78"
                          style={{ width: "100%", fontSize: 16, padding: "10px 14px", border: "1px solid #D1D5DB", borderRadius: 10, boxSizing: "border-box" }}
                        />
                      </div>
                      <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 5 }}>
                        Your number is always shown as ●●●●●●●● on your profile — visitors click "Show number" to reveal it.
                      </p>
                    </div>

                    {/* Phone verification block */}
                    {form.phone && form.phone.length > 6 && !phoneVerified && (
                      <div style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 10, padding: "14px 16px" }}>
                        <p style={{ fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 10 }}>
                          Verify your phone number <span style={{ fontWeight: 400, color: "#9CA3AF" }}>(optional — adds ✓ Verified badge to profile)</span>
                        </p>
                        {!showVerifyInput ? (
                          <div>
                            {/* Channel picker */}
                            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                              {(["whatsapp", "sms"] as const).map(ch => (
                                <button key={ch} type="button"
                                  onClick={() => setVerifyChannel(ch)}
                                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 8, border: `1.5px solid ${verifyChannel === ch ? (ch === "whatsapp" ? "#25D366" : "#3B82F6") : "#E5E7EB"}`, background: verifyChannel === ch ? (ch === "whatsapp" ? "#F0FDF4" : "#EFF6FF") : "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600, color: verifyChannel === ch ? (ch === "whatsapp" ? "#16A34A" : "#1D4ED8") : "#9CA3AF" }}>
                                  <img src={ch === "whatsapp" ? "/logos/whatsapp.jpg" : undefined} alt={ch} style={{ width: 16, height: 16, borderRadius: 4, display: ch === "whatsapp" ? "block" : "none" }} />
                                  {ch === "sms" && <span style={{ fontSize: 14 }}>💬</span>}
                                  {ch === "whatsapp" ? "WhatsApp" : "SMS"}
                                </button>
                              ))}
                            </div>
                            <button type="button" onClick={() => sendPhoneVerification(verifyChannel)} disabled={verifySending}
                              style={{ fontSize: 13, fontWeight: 600, color: "#DC2626", border: "1px solid #FECACA", borderRadius: 8, padding: "7px 14px", background: "#FEF2F2", cursor: "pointer", opacity: verifySending ? 0.6 : 1 }}>
                              {verifySending ? `Sending via ${verifyChannel}...` : `Send code via ${verifyChannel === "whatsapp" ? "WhatsApp" : "SMS"} →`}
                            </button>
                          </div>
                        ) : (
                          <div>
                            <p style={{ fontSize: 11, color: "#6B7280", marginBottom: 8 }}>
                              Enter the 6-digit code sent to <strong>{form.phone}</strong>
                            </p>
                            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                              <input
                                type="text"
                                inputMode="numeric"
                                value={verifyCode}
                                onChange={e => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                placeholder="_ _ _ _ _ _"
                                maxLength={6}
                                style={{ fontSize: 20, letterSpacing: 6, fontWeight: 700, padding: "8px 14px", border: "2px solid #E5E7EB", borderRadius: 10, width: 160, textAlign: "center" }}
                              />
                              <button type="button" onClick={confirmPhoneCode} disabled={verifyChecking || verifyCode.length < 4}
                                style={{ fontSize: 13, fontWeight: 700, background: "#111", color: "#fff", border: "none", borderRadius: 8, padding: "9px 16px", cursor: "pointer", opacity: (verifyChecking || verifyCode.length < 4) ? 0.5 : 1 }}>
                                {verifyChecking ? "Checking..." : "Confirm"}
                              </button>
                            </div>
                            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                              <button type="button" onClick={() => sendPhoneVerification(verifyChannel)}
                                style={{ fontSize: 11, color: "#9CA3AF", background: "none", border: "none", cursor: "pointer" }}>
                                Resend code
                              </button>
                              <button type="button" onClick={() => { setShowVerifyInput(false); setVerifyCode(""); }}
                                style={{ fontSize: 11, color: "#9CA3AF", background: "none", border: "none", cursor: "pointer" }}>
                                Change number
                              </button>
                            </div>
                          </div>
                        )}
                        {verifyError && <p style={{ fontSize: 12, color: "#DC2626", marginTop: 8 }}>{verifyError}</p>}
                      </div>
                    )}
                    {phoneVerified && (
                      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#16A34A", fontWeight: 600, padding: "8px 12px", background: "#F0FDF4", borderRadius: 8 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                        Phone verified ✓
                      </div>
                    )}
                    {/* Other contact fields with logos from Simple Icons CDN */}
                    {[
                      { label: "WhatsApp",   field: "whatsapp",          bg: "#25D366", icon: "https://cdn.simpleicons.org/whatsapp/ffffff",   radius: 12, placeholder: "+45 12 34 56 78" },
                      { label: "Telegram",   field: "telegram",          bg: "#26A5E4", icon: "https://cdn.simpleicons.org/telegram/ffffff",   radius: 12, placeholder: "@username or +45..." },
                      { label: "Signal",     field: "signal",            bg: "#3A76F0", icon: "https://cdn.simpleicons.org/signal/ffffff",     radius: 12, placeholder: "+45 12 34 56 78" },
                      { label: "Snapchat",   field: "snapchat",          bg: "#FFFC00", icon: "https://cdn.simpleicons.org/snapchat/000000",   radius: 8,  placeholder: "Snapchat username" },
                      { label: "Instagram",  field: "instagram",         bg: "#E1306C", icon: "https://cdn.simpleicons.org/instagram/ffffff",  radius: 8,  placeholder: "@username" },
                      { label: "X / Twitter",field: "x_twitter",         bg: "#000000", icon: "https://cdn.simpleicons.org/x/ffffff",          radius: 12, placeholder: "@username" },
                      { label: "OnlyFans",   field: "onlyfans_username", bg: "#00AFF0", icon: "https://cdn.simpleicons.org/onlyfans/ffffff",   radius: 8,  placeholder: "username" },
                      { label: "Email",      field: "email",             bg: "#6B7280", icon: null,                                            radius: 8,  placeholder: "your@email.com" },
                    ].map((c) => (
                      <div key={c.field} style={{ display: "flex", alignItems: "center", gap: 10, border: "1px solid #E5E7EB", borderRadius: 10, padding: "10px 14px", background: "#fff" }}>
                        <div style={{ width: 28, height: 28, borderRadius: c.radius, background: c.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {c.icon ? (
                            <img src={c.icon} alt={c.label} style={{ width: 16, height: 16 }} />
                          ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></svg>
                          )}
                        </div>
                        <span style={{ width: 84, fontSize: 13, color: "#6B7280", flexShrink: 0 }}>{c.label}</span>
                        <input
                          type={c.field === "email" ? "email" : "text"}
                          value={(form[c.field as keyof typeof form] as string) ?? ""}
                          onChange={(e) => updateField(c.field, e.target.value)}
                          placeholder={c.placeholder}
                          style={{ fontSize: 16, flex: 1, border: "none", outline: "none", background: "transparent", color: "#111" }}
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

                {/* ── AVAILABILITY & OPENING HOURS ── */}
                <div>
                  <p className="text-base font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">{t.availability_hours}</p>

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
                            style={{ fontSize: 16 }}
                            className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:border-red-400 disabled:bg-gray-100 disabled:text-gray-400"
                          >
                            {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                          <select
                            disabled={h.closed}
                            value={h.close}
                            onChange={e => setOpeningHours(prev => ({ ...prev, [day]: { ...prev[day], close: e.target.value } }))}
                            style={{ fontSize: 16 }}
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
                    Photos <span className="text-gray-400">(max 20 &bull; JPG, PNG &bull; max 5MB each)</span>
                  </label>

                  {/* Photo upload guidelines */}
                  <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderLeft: "3px solid #DC2626", borderRadius: 8, padding: "12px 14px", marginBottom: 16 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: "#991B1B", marginBottom: 6 }}>NOT ALLOWED:</p>
                    {["Phone number, logo, watermark or text on photos", "Explicit nudity (nipples or genitals)", "Photos must show the advertiser only", "Low quality or blurry photos", "Duplicate photos"].map(r => (
                      <div key={r} style={{ display: "flex", gap: 6, fontSize: 11, color: "#DC2626", marginBottom: 2 }}>
                        <span>✕</span><span>{r}</span>
                      </div>
                    ))}
                  </div>

                  {/* Drop zone */}
                  <div
                    className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-red-400 transition-colors"
                    onClick={() => document.getElementById("image-input")?.click()}
                  >
                    <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                    <p className="text-gray-500 text-sm font-medium">Click to upload photos</p>
                    <p className="text-xs text-gray-400 mt-1">First photo will be used as profile picture</p>
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
                              Profile
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
                    <p className="text-xs text-gray-500 mt-2">{imageFiles.length} photo{imageFiles.length !== 1 ? "s" : ""} selected</p>
                  )}
                </div>

                {/* Preview */}
                <div className="rounded-xl bg-gray-50 p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-700">Preview</span>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p><span className="font-medium">Title:</span> {form.title || "–"}</p>
                    <p><span className="font-medium">Category:</span> {form.category || "–"}</p>
                    <p><span className="font-medium">Gender:</span> {(GENDER_LABELS[form.gender]?.[locale] ?? form.gender) || "–"}</p>
                    <p><span className="font-medium">Age:</span> {form.age || "–"}</p>
                    <p><span className="font-medium">Location:</span> {form.location || "–"}</p>
                    {form.about && (
                      <p>
                        <span className="font-medium">About me:</span>{" "}
                        {form.about.length > 100 ? form.about.slice(0, 100) + "..." : form.about}
                      </p>
                    )}
                    {serviceEntries.filter(s => s.included !== "").length > 0 && (
                      <p><span className="font-medium">Services:</span> {serviceEntries.filter(s => s.included !== "").length} selected</p>
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
                    <p className="text-sm text-gray-400">Upgrade to Premium to add a voice message</p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="w-full sm:w-auto rounded-xl border border-gray-300 px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  ← Back
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
                  Publish listing
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
