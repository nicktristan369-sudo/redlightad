"use client";

import { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { SUPPORTED_COUNTRIES } from "@/lib/countries";

// ── Landekoder til telefon ───────────────────────────────────────────────────
const DIAL_CODES: Record<string, string> = {
  dk: "+45", se: "+46", no: "+47", fi: "+358", de: "+49", nl: "+31",
  gb: "+44", fr: "+33", es: "+34", it: "+39", ch: "+41", at: "+43",
  be: "+32", pl: "+48", cz: "+420", hu: "+36", th: "+66", ae: "+971",
  sg: "+65", jp: "+81", hk: "+852", my: "+60", ph: "+63", vn: "+84",
  id: "+62", in: "+91", us: "+1", ca: "+1", mx: "+52", br: "+55",
  ar: "+54", au: "+61", nz: "+64", za: "+27",
}

// ── Byer per land ────────────────────────────────────────────────────────────
const CITIES_BY_COUNTRY: Record<string, string[]> = {
  Denmark: ["København","Aarhus","Odense","Aalborg","Esbjerg","Randers","Kolding","Horsens","Vejle","Roskilde","Helsingør","Herning","Silkeborg","Næstved","Fredericia","Viborg","Køge","Holstebro","Taastrup","Slagelse","Hillerød","Svendborg","Frederiksberg","Gentofte"],
  Sweden: ["Stockholm","Göteborg","Malmö","Uppsala","Västerås","Örebro","Linköping","Helsingborg","Jönköping","Norrköping","Lund","Umeå","Gävle","Borås","Sundsvall","Södertälje","Karlstad","Eskilstuna","Halmstad","Växjö"],
  Norway: ["Oslo","Bergen","Trondheim","Stavanger","Drammen","Fredrikstad","Kristiansand","Sandnes","Tromsø","Sarpsborg","Skien","Ålesund","Sandefjord","Haugesund","Tønsberg","Moss","Porsgrunn","Bodø","Arendal","Hamar"],
  Finland: ["Helsinki","Espoo","Tampere","Vantaa","Oulu","Turku","Jyväskylä","Lahti","Kuopio","Kouvola","Pori","Joensuu","Lappeenranta","Hämeenlinna","Vaasa","Rovaniemi","Seinäjoki","Mikkeli","Kotka","Salo"],
  Germany: ["Berlin","Hamburg","München","Köln","Frankfurt","Stuttgart","Düsseldorf","Leipzig","Dortmund","Essen","Bremen","Dresden","Hannover","Nürnberg","Duisburg","Bochum","Wuppertal","Bielefeld","Bonn","Münster"],
  Netherlands: ["Amsterdam","Rotterdam","Den Haag","Utrecht","Eindhoven","Tilburg","Groningen","Almere","Breda","Nijmegen","Enschede","Apeldoorn","Haarlem","Arnhem","Zaanstad","Amersfoort","Haarlemmermeer","'s-Hertogenbosch","Zwolle","Zoetermeer"],
  "United Kingdom": ["London","Birmingham","Leeds","Glasgow","Sheffield","Bradford","Manchester","Edinburgh","Liverpool","Bristol","Cardiff","Leicester","Coventry","Nottingham","Newcastle","Belfast","Brighton","Hull","Plymouth","Derby"],
  France: ["Paris","Marseille","Lyon","Toulouse","Nice","Nantes","Strasbourg","Montpellier","Bordeaux","Lille","Rennes","Reims","Le Havre","Saint-Étienne","Toulon","Grenoble","Dijon","Angers","Nîmes","Villeurbanne"],
  Spain: ["Madrid","Barcelona","Valencia","Seville","Zaragoza","Málaga","Murcia","Palma","Las Palmas","Bilbao","Alicante","Córdoba","Valladolid","Vigo","Gijón","Granada","Hospitalet","La Coruña","Vitoria","Elche"],
  Italy: ["Roma","Milano","Napoli","Torino","Palermo","Genova","Bologna","Firenze","Bari","Catania","Venezia","Verona","Messina","Padova","Trieste","Taranto","Brescia","Reggio Calabria","Prato","Modena"],
  Switzerland: ["Zürich","Genf","Basel","Bern","Lausanne","Winterthur","Luzern","St. Gallen","Lugano","Biel","Thun","Köniz","La Chaux-de-Fonds","Fribourg","Schaffhausen","Chur","Vernier","Uster","Sion","Emmen"],
  Austria: ["Wien","Graz","Linz","Salzburg","Innsbruck","Klagenfurt","Villach","Wels","Sankt Pölten","Dornbirn","Steyr","Wiener Neustadt","Feldkirch","Bregenz","Leonding","Klosterneuburg","Leoben","Krems","Traun","Amstetten"],
  Belgium: ["Bruxelles","Antwerpen","Gent","Charleroi","Liège","Brugge","Namur","Leuven","Mons","Aalst","Mechelen","La Louvière","Kortrijk","Hasselt","Oostende","Sint-Niklaas","Tournai","Genk","Seraing","Roeselare"],
  Poland: ["Warszawa","Kraków","Łódź","Wrocław","Poznań","Gdańsk","Szczecin","Bydgoszcz","Lublin","Katowice","Białystok","Gdynia","Częstochowa","Radom","Sosnowiec","Toruń","Kielce","Rzeszów","Gliwice","Zabrze"],
  "Czech Republic": ["Praha","Brno","Ostrava","Plzeň","Liberec","Olomouc","Ústí nad Labem","České Budějovice","Hradec Králové","Pardubice","Zlín","Havířov","Kladno","Most","Opava","Frýdek-Místek","Karviná","Jihlava","Teplice","Děčín"],
  Hungary: ["Budapest","Debrecen","Miskolc","Szeged","Pécs","Győr","Nyíregyháza","Kecskemét","Székesfehérvár","Szombathely","Érd","Tatabánya","Kaposvár","Veszprém","Eger","Sopron","Zalaegerszeg","Szolnok","Dunaújváros","Ózd"],
  Thailand: ["Bangkok","Chiang Mai","Pattaya","Phuket","Hua Hin","Koh Samui","Udon Thani","Nakhon Ratchasima","Chon Buri","Hat Yai","Lampang","Nakhon Si Thammarat","Ubon Ratchathani","Rayong","Khon Kaen","Nonthaburi","Pak Kret","Samut Prakan","Mueang Nakhon Sawan","Pak Chong"],
  UAE: ["Dubai","Abu Dhabi","Sharjah","Al Ain","Ajman","Ras Al Khaimah","Fujairah","Umm Al Quwain","Khor Fakkan","Kalba"],
  Singapore: ["Singapore"],
  Japan: ["Tokyo","Osaka","Yokohama","Nagoya","Sapporo","Fukuoka","Kobe","Kyoto","Kawasaki","Saitama","Hiroshima","Sendai","Kitakyushu","Chiba","Sakai","Kumamoto","Okayama","Shizuoka","Hamamatsu","Niigata"],
  "Hong Kong": ["Hong Kong","Kowloon","New Territories","Lantau Island"],
  Malaysia: ["Kuala Lumpur","George Town","Ipoh","Shah Alam","Petaling Jaya","Kota Kinabalu","Kuching","Johor Bahru","Malacca","Miri"],
  Philippines: ["Manila","Quezon City","Davao","Cebu","Makati","Mandaluyong","Pasig","Taguig","Cagayan de Oro","Zamboanga"],
  USA: ["New York","Los Angeles","Chicago","Houston","Phoenix","Philadelphia","San Antonio","San Diego","Dallas","San Jose","Austin","Jacksonville","Fort Worth","Columbus","Charlotte","Indianapolis","San Francisco","Seattle","Denver","Nashville"],
  Canada: ["Toronto","Montreal","Vancouver","Calgary","Edmonton","Ottawa","Mississauga","Winnipeg","Quebec City","Hamilton"],
  Australia: ["Sydney","Melbourne","Brisbane","Perth","Adelaide","Gold Coast","Newcastle","Canberra","Sunshine Coast","Wollongong"],
}

// ── Kategorier — matcher navbar ──────────────────────────────────────────────
const CATEGORIES = [
  { value: "escort", label: "Escort" },
  { value: "massage", label: "Massage" },
  { value: "webcam", label: "Webcam" },
  { value: "fetish", label: "Fetish" },
  { value: "couples", label: "Couples" },
  { value: "onlyfans", label: "OnlyFans" },
]

// ── Rens telefonnummer fra scraper ────────────────────────────────────────────
function cleanPhoneNumber(raw: string, dialCode: string): string {
  if (!raw) return ""
  // Fjern // prefix, mellemrum og bindestreger
  let n = raw.replace(/^\/\//, "").replace(/\s|-/g, "").trim()
  // Fjern international kode prefix (+45, 0045, 45) fra starten
  const intl = dialCode.replace("+", "")
  if (n.startsWith(dialCode)) n = n.slice(dialCode.length)
  else if (n.startsWith("00" + intl)) n = n.slice(2 + intl.length)
  else if (n.startsWith(intl) && n.length > 8) n = n.slice(intl.length)
  return n
}

type ProfileData = {
  display_name: string;
  phone: string;
  phoneDialCode: string;
  email: string;
  description: string;
  city: string;
  country: string;
  gender: string;
  category: string;
  age: number | null;
  images: string[];
  videos: string[];
  stories: { media_url: string; media_type: string; thumbnail_url: string; duration: number }[];
  source_url: string;
  // Ekstra profil felter
  height_cm?: number | null;
  weight_kg?: number | null;
  ethnicity?: string;
  eye_color?: string;
  hair_color?: string;
  hair_length?: string;
  pubic_hair?: string;
  bust_size?: string;
  bust_type?: string;
  orientation?: string;
  smoker?: string;
  tattoo?: string;
  piercing?: string;
  nationality?: string;
  available_for?: string;
  meeting_with?: string;
  travel?: string;
  // Priser
  rate_1hour?: number | null;
  rate_2hours?: number | null;
  rate_overnight?: number | null;
  rate_weekend?: number | null;
  // Levende profilbillede
  profile_video_url?: string | null;
  // Betalingsmetoder
  payment_methods?: string[];
  // OnlyFans
  onlyfans_username?: string;
  onlyfans_price_usd?: number | null;
  // Kontakt / sociale medier
  telegram?: string;
  whatsapp?: string;
  signal?: string;
  viber?: string;
  wechat?: string;
  line_app?: string;
  // Video URL (ekstern)
  video_url?: string;
  // Ekstra
  height?: string;
  weight?: string;
};

type CreateResult = {
  success: boolean;
  userId: string;
  listingId?: string;
  videoIds?: { id: string; url: string }[];
  username?: string;
  loginId?: string;
  email: string;
  password: string;
  phone?: string;
  smsStatus: string;
};

const ETHNICITY_OPTIONS = ["Asian", "Ebony (black)", "Caucasian (white)", "Hispanic", "Indian", "Latin", "Mixed race", "Middle Eastern", "Other"];
const EYE_OPTIONS = ["Blue", "Blue-green", "Brown", "Green", "Grey", "Hazel", "Black"];
const HAIR_COLOR_OPTIONS = ["Blonde", "Brown", "Black", "Red", "Grey/Silver", "Other"];
const HAIR_LENGTH_OPTIONS = ["Short", "Medium long", "Long"];
const PUBIC_OPTIONS = ["Shaved", "Trimmed", "Natural", "Landing strip", "Other"];
const BUST_SIZE_OPTIONS = ["A", "B", "C", "D", "E", "F", "G", "H+"];
const BUST_TYPE_OPTIONS = ["Natural", "Silicon"];
const ORIENTATION_OPTIONS = ["Straight", "Bisexual", "Lesbian", "Homosexual"];
const SMOKER_OPTIONS = ["Yes", "No", "Sometimes"];
const TATTOO_OPTIONS = ["Yes", "No"];
const PIERCING_OPTIONS = ["No", "Belly", "Eyebrow", "Genitals", "Mouth area", "Nose", "Nipples", "Tongue", "Multiple"];
const AVAILABLE_FOR_OPTIONS = ["Outcall", "Incall", "Outcall + Incall"];
const MEETING_WITH_OPTIONS = ["Man", "Woman", "Couple", "Multiple men", "Everyone"];
const TRAVEL_OPTIONS = ["No", "Countrywide", "Europe", "Worldwide"];

export default function CreateProfilePage() {
  const [step, setStep] = useState(1);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [sendSMS, setSendSMS] = useState(true);
  const [showExtra, setShowExtra] = useState(false);
  const [dewatermarkStatus, setDewatermarkStatus] = useState<Record<string, string>>({});
  const [profile, setProfile] = useState<ProfileData>({
    display_name: "",
    phone: "",
    phoneDialCode: "+45",
    email: "",
    description: "",
    city: "",
    country: "Denmark",
    gender: "female",
    category: "escort",
    age: null,
    images: [],
    videos: [],
    stories: [],
    source_url: "",
    height_cm: null,
    weight_kg: null,
  });
  const [result, setResult] = useState<CreateResult | null>(null);
  const [importUrl, setImportUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState("");
  const [importedImages, setImportedImages] = useState<string[]>([]);
  const [importingVideo, setImportingVideo] = useState(false);
  const [dewatermarking, setDewatermarking] = useState(false);
  const [videoImportMsg, setVideoImportMsg] = useState("");

  // Fuzzy match: find closest option value (case-insensitive, partial)
  const matchOption = (value: string, options: string[]): string => {
    if (!value) return "";
    const v = value.toLowerCase();
    return options.find(o => o.toLowerCase() === v)
      || options.find(o => o.toLowerCase().includes(v) || v.includes(o.toLowerCase()))
      || "";
  };

  const handleImport = async () => {
    if (!importUrl.trim()) return;
    setImporting(true);
    setImportMsg("");
    try {
      const res = await fetch("/api/admin/scrape-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: importUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Scraping fejlede");

      setProfile(prev => ({
        ...prev,
        ...(data.name && { title: data.name, display_name: data.name }),
        ...(data.age && !isNaN(parseInt(data.age)) && { age: parseInt(data.age) }),
        ...(data.city && { location: data.city }),
        ...(data.description && { description: data.description }),
        ...(data.phone && { phone: data.phone }),
        ...(data.height && { height: data.height }),
        ...(data.weight && { weight: data.weight }),
        ...(data.nationality && { nationality: data.nationality }),
        ...(data.telegram && { telegram: data.telegram }),
        ...(data.video && { video_url: data.video }),
        // Dropdowns — fuzzy match
        ...(data.ethnicity && { ethnicity: matchOption(data.ethnicity, ETHNICITY_OPTIONS) }),
        ...(data.orientation && { orientation: matchOption(data.orientation, ORIENTATION_OPTIONS) }),
        ...(data.eye_color && { eye_color: matchOption(data.eye_color, EYE_OPTIONS) }),
        ...(data.hair_color && { hair_color: matchOption(data.hair_color, HAIR_COLOR_OPTIONS) }),
        ...(data.hair_length && { hair_length: matchOption(data.hair_length, HAIR_LENGTH_OPTIONS) }),
        ...(data.pubic_hair && { pubic_hair: matchOption(data.pubic_hair, PUBIC_OPTIONS) }),
        ...(data.bust_size && { bust_size: matchOption(data.bust_size, BUST_SIZE_OPTIONS) }),
        ...(data.bust_type && { bust_type: matchOption(data.bust_type, BUST_TYPE_OPTIONS) }),
        ...(data.smoker && { smoker: matchOption(data.smoker, SMOKER_OPTIONS) }),
        ...(data.tattoo && { tattoo: matchOption(data.tattoo, TATTOO_OPTIONS) }),
        ...(data.piercing && { piercing: matchOption(data.piercing, PIERCING_OPTIONS) }),
        ...(data.available && { available_for: matchOption(data.available, AVAILABLE_FOR_OPTIONS) }),
        ...(data.meeting_with && { meeting_with: matchOption(data.meeting_with, MEETING_WITH_OPTIONS) }),
        ...(data.travel && { travel: matchOption(data.travel, TRAVEL_OPTIONS) }),
      }));

      if (data.images?.length > 0) setImportedImages(data.images);
      setImportMsg("✓ Importeret fra " + new URL(importUrl).hostname);
    } catch (e: unknown) {
      setImportMsg(e instanceof Error ? e.message : "Fejl");
    } finally {
      setImporting(false);
    }
  };

  const handleScrape = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/scrape-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (data.profile) {
        // Find dialcode fra landet, rens telefonnummeret
        const scraped = data.profile;
        const countryCode = SUPPORTED_COUNTRIES.find(c => c.name === scraped.country)?.code ?? "dk";
        const dialCode = DIAL_CODES[countryCode] ?? "+45";
        const cleanedPhone = cleanPhoneNumber(scraped.phone ?? "", dialCode);
        setProfile({ ...scraped, email: "", phoneDialCode: dialCode, phone: cleanedPhone });
        setStep(2);
      } else {
        setError("Kunne ikke hente profil data");
      }
    } catch {
      setError("Fejl ved hentning af URL");
    } finally {
      setLoading(false);
    }
  };

  // Start dewatermark jobs for alle videoer efter oprettelse
  const startDewatermark = async (videoIds: { id: string; url: string }[]) => {
    for (const v of videoIds) {
      setDewatermarkStatus(prev => ({ ...prev, [v.id]: "starting" }));
      try {
        const res = await fetch("/api/admin/video-dewatermark", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ videoUrl: v.url, videoId: v.id }),
        });
        const data = await res.json();
        if (data.jobId) {
          setDewatermarkStatus(prev => ({ ...prev, [v.id]: `job:${data.jobId}` }));
          pollDewatermark(v.id, data.jobId);
        } else {
          setDewatermarkStatus(prev => ({ ...prev, [v.id]: "error" }));
        }
      } catch {
        setDewatermarkStatus(prev => ({ ...prev, [v.id]: "error" }));
      }
    }
  };

  const pollDewatermark = async (videoId: string, jobId: string) => {
    for (let i = 0; i < 60; i++) {
      await new Promise(r => setTimeout(r, 5000));
      try {
        const res = await fetch(`/api/admin/video-dewatermark?job_id=${jobId}&video_id=${videoId}`);
        const data = await res.json();
        if (data.status === "done") {
          setDewatermarkStatus(prev => ({ ...prev, [videoId]: "done" }));
          return;
        }
        if (data.status === "failed") {
          setDewatermarkStatus(prev => ({ ...prev, [videoId]: "failed" }));
          return;
        }
        setDewatermarkStatus(prev => ({ ...prev, [videoId]: "processing" }));
      } catch {
        // ignore poll errors
      }
    }
    setDewatermarkStatus(prev => ({ ...prev, [videoId]: "timeout" }));
  };

  const handleCreate = async () => {
    if (!profile.display_name.trim()) {
      setError("Navn er påkrævet");
      return;
    }
    setCreating(true);
    setError("");
    try {
      const res = await fetch("/api/admin/create-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, sendSMSNotification: sendSMS }),
      });
      const data = await res.json();
      if (data.success) {
        setResult(data);
        setStep(3);
        // Auto-start watermark removal for alle videoer
        if (data.videoIds && data.videoIds.length > 0) {
          startDewatermark(data.videoIds);
        }
      } else {
        setError(data.error || "Fejl ved oprettelse");
      }
    } catch {
      setError("Netværksfejl");
    } finally {
      setCreating(false);
    }
  };

  const reset = () => {
    setStep(1);
    setUrl("");
    setProfile({
      display_name: "", phone: "", phoneDialCode: "+45", email: "", description: "",
      city: "", country: "Denmark", gender: "female", category: "escort",
      age: null, images: [], videos: [], stories: [], source_url: "",
      height_cm: null, weight_kg: null,
    });
    setResult(null);
    setError("");
    setSendSMS(true);
    setShowExtra(false);
    setDewatermarkStatus({});
  };

  const p = (field: keyof ProfileData, val: unknown) => setProfile(prev => ({ ...prev, [field]: val }));

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 12px", fontSize: 13,
    border: "1px solid #E5E5E5", borderRadius: 8, outline: "none", background: "#fff",
  };
  const labelStyle: React.CSSProperties = {
    fontSize: 12, fontWeight: 600, color: "#374151", marginBottom: 4, display: "block",
  };
  const selectStyle = { ...inputStyle };

  return (
    <AdminLayout>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <h1 className="text-[22px] font-bold text-gray-900 mb-1">Opret profil</h1>
        <p className="text-[13px] text-gray-500 mb-6">Scrape en annonce og opret bruger automatisk</p>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold"
                style={{ background: step >= s ? "#000" : "#E5E5E5", color: step >= s ? "#fff" : "#9CA3AF" }}>
                {s}
              </div>
              {s < 3 && <div style={{ width: 32, height: 2, background: step > s ? "#000" : "#E5E5E5", borderRadius: 1 }} />}
            </div>
          ))}
          <span className="text-[12px] text-gray-400 ml-2">
            {step === 1 && "Hent info"}{step === 2 && "Gennemse"}{step === 3 && "Resultat"}
          </span>
        </div>

        {error && (
          <div className="text-[13px] px-4 py-3 rounded-lg mb-4" style={{ background: "#FEE2E2", color: "#7F1D1D" }}>
            {error}
          </div>
        )}

        {/* ── Step 1 ── */}
        {step === 1 && (
          <div className="bg-white rounded-xl p-6" style={{ border: "1px solid #E5E5E5" }}>
            <label style={labelStyle}>Annonce URL</label>
            <div className="flex gap-2">
              <input type="url" value={url} onChange={e => setUrl(e.target.value)}
                placeholder="https://..." style={inputStyle}
                onKeyDown={e => e.key === "Enter" && handleScrape()} />
              <button onClick={handleScrape} disabled={loading || !url.trim()}
                className="px-5 py-2.5 rounded-lg text-[13px] font-semibold whitespace-nowrap"
                style={{ background: loading || !url.trim() ? "#E5E5E5" : "#000", color: loading || !url.trim() ? "#9CA3AF" : "#fff", cursor: loading || !url.trim() ? "not-allowed" : "pointer" }}>
                {loading ? <span className="flex items-center gap-2"><span className="w-3.5 h-3.5 border-2 border-gray-400 border-t-white rounded-full animate-spin" />Henter...</span> : "Hent info"}
              </button>
            </div>
            <p className="text-[11px] text-gray-400 mt-2">Indsæt link til en annonce — vi henter navn, telefon, by og beskrivelse automatisk</p>
            <div className="mt-4 pt-4" style={{ borderTop: "1px solid #F3F4F6" }}>
              <button onClick={() => setStep(2)} className="text-[12px] font-medium" style={{ color: "#6B7280" }}>
                Eller opret manuelt uden URL →
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2 ── */}
        {step === 2 && (
          <div className="bg-white rounded-xl p-6" style={{ border: "1px solid #E5E5E5" }}>
            <div className="space-y-4">

              {/* ── Import fra ekstern URL ── */}
              <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 12, padding: "14px 16px" }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#166534", margin: "0 0 4px" }}>Import fra ekstern URL</p>
                <p style={{ fontSize: 12, color: "#4B7C5D", margin: "0 0 10px" }}>Kun med eskortens samtykke. Auto-udfylder form.</p>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    type="url"
                    placeholder="https://www.eurogirlsescort.com/escort/..."
                    value={importUrl}
                    onChange={e => setImportUrl(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleImport()}
                    style={{ flex: 1, height: 38, padding: "0 12px", border: "1px solid #D1FAE5", borderRadius: 8, fontSize: 13, outline: "none", background: "#fff" }}
                  />
                  <button
                    onClick={handleImport}
                    disabled={importing || !importUrl.trim()}
                    style={{ height: 38, padding: "0 16px", borderRadius: 8, background: "#16A34A", color: "#fff", border: "none", fontWeight: 600, fontSize: 13, cursor: importing ? "not-allowed" : "pointer", opacity: importing ? 0.6 : 1, whiteSpace: "nowrap" }}
                  >
                    {importing ? "Henter..." : "Import"}
                  </button>
                </div>
                {importMsg && (
                  <p style={{ fontSize: 12, marginTop: 8, color: importMsg.startsWith("✓") ? "#16A34A" : "#DC2626" }}>{importMsg}</p>
                )}
                {importedImages.length > 0 && (
                  <div style={{ marginTop: 10 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: "#166534", marginBottom: 6 }}>Importerede billeder ({importedImages.length}):</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {importedImages.map((src, i) => (
                        <img key={i} src={src} alt="" style={{ width: 72, height: 72, objectFit: "cover", borderRadius: 8, border: "2px solid #BBF7D0" }} />
                      ))}
                    </div>
                    <p style={{ fontSize: 11, color: "#6B7280", marginTop: 6 }}>Billeder vises som preview. Upload dem manuelt i Media-sektionen nedenfor.</p>
                  </div>
                )}
              </div>

              {/* Navn */}
              <div>
                <label style={labelStyle}>Navn *</label>
                <input type="text" value={profile.display_name} onChange={e => p("display_name", e.target.value)} style={inputStyle} placeholder="Display name" />
              </div>

                            {/* Arbejdsland — styrer by-liste + landekode */}
              <div>
                <label style={labelStyle}>Arbejdsland <span style={{ fontWeight: 400, color: "#9CA3AF" }}>(land escorten arbejder i)</span></label>
                <select
                  value={profile.country}
                  onChange={e => {
                    const countryName = e.target.value;
                    const code = SUPPORTED_COUNTRIES.find(c => c.name === countryName)?.code ?? "dk";
                    const dial = DIAL_CODES[code] ?? "+45";
                    setProfile(prev => ({ ...prev, country: countryName, city: "", phoneDialCode: dial }));
                  }}
                  style={selectStyle}
                >
                  {SUPPORTED_COUNTRIES.map(c => (
                    <option key={c.code} value={c.name}>{c.flag} {c.name}</option>
                  ))}
                </select>
              </div>

              {/* Telefon + By */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label style={labelStyle}>Telefon</label>
                  <div style={{ display: "flex", gap: 0, border: "1px solid #E5E5E5", borderRadius: 8, overflow: "hidden", background: "#fff" }}>
                    <select
                      value={profile.phoneDialCode}
                      onChange={e => p("phoneDialCode", e.target.value)}
                      style={{ padding: "10px 6px", fontSize: 13, border: "none", borderRight: "1px solid #E5E5E5", background: "#F9FAFB", outline: "none", flexShrink: 0, minWidth: 80 }}
                    >
                      {SUPPORTED_COUNTRIES.map(c => {
                        const dial = DIAL_CODES[c.code]
                        if (!dial) return null
                        return <option key={c.code} value={dial}>{c.flag} {dial}</option>
                      })}
                    </select>
                    <input
                      type="tel"
                      value={profile.phone}
                      onChange={e => p("phone", e.target.value)}
                      style={{ flex: 1, padding: "10px 12px", fontSize: 13, border: "none", outline: "none", background: "transparent" }}
                      placeholder="50 33 68 92"
                    />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>By</label>
                  <select value={profile.city} onChange={e => p("city", e.target.value)} style={selectStyle}>
                    <option value="">Vælg by...</option>
                    {(CITIES_BY_COUNTRY[profile.country] ?? []).map(by => (
                      <option key={by} value={by}>{by}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Who are you? */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: "#374151", display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Who are you? *
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                  {[
                    { gender: "female",  category: "escort",  label: "Woman",  emoji: "👩" },
                    { gender: "male",    category: "escort",  label: "Man",    emoji: "👨" },
                    { gender: "trans",   category: "escort",  label: "Trans",  emoji: "⚧" },
                    { gender: "female",  category: "couples", label: "Couple", emoji: "👫" },
                  ].map(opt => {
                    const selected = profile.gender === opt.gender && profile.category === opt.category
                    return (
                      <button
                        key={opt.label}
                        type="button"
                        onClick={() => { p("gender", opt.gender); p("category", opt.category) }}
                        style={{
                          padding: "12px 8px", borderRadius: 10, border: selected ? "2px solid #DC2626" : "1px solid #E5E7EB",
                          background: selected ? "#FEF2F2" : "#F9FAFB", cursor: "pointer",
                          display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 4,
                          fontSize: 11, fontWeight: 700, color: selected ? "#DC2626" : "#6B7280",
                        }}
                      >
                        <span style={{ fontSize: 20 }}>{opt.emoji}</span>
                        {opt.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Service type (category) */}
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Service type</label>
                <select value={profile.category} onChange={e => p("category", e.target.value)} style={selectStyle}>
                  {CATEGORIES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              {/* Alder + Email */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label style={labelStyle}>Alder</label>
                  <select value={profile.age ?? 25} onChange={e => p("age", parseInt(e.target.value))} style={selectStyle}>
                    {Array.from({ length: 63 }, (_, i) => i + 18).map(a => (
                      <option key={a} value={a}>{a} år</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Email (valgfri)</label>
                  <input type="email" value={profile.email} onChange={e => p("email", e.target.value)} style={inputStyle} placeholder="Genereres automatisk hvis tom" />
                </div>
              </div>

              {/* Beskrivelse */}
              <div>
                <label style={labelStyle}>Beskrivelse</label>
                <textarea value={profile.description} onChange={e => p("description", e.target.value)}
                  rows={4} style={{ ...inputStyle, resize: "vertical" as const }} placeholder="Profiltekst..." />
              </div>

              {/* ── Ekstra profil info (collapsible) ── */}
              <div style={{ borderTop: "1px solid #F3F4F6", paddingTop: 16 }}>
                <button onClick={() => setShowExtra(!showExtra)}
                  className="flex items-center gap-2 text-[13px] font-semibold text-gray-700 w-full text-left">
                  <span style={{ fontSize: 16, transform: showExtra ? "rotate(90deg)" : "none", display: "inline-block", transition: "transform 0.15s" }}>▶</span>
                  Ekstra profil oplysninger
                  <span className="text-[11px] font-normal text-gray-400 ml-1">(valgfrit)</span>
                </button>

                {showExtra && (
                  <div className="space-y-4 mt-4">
                    {/* Nationalitet */}
                    <div>
                      <label style={labelStyle}>Nationalitet</label>
                      <input type="text" value={profile.nationality || ""} onChange={e => p("nationality", e.target.value)} style={inputStyle} placeholder="f.eks. Dansk, Russisk, Brasiliansk..." />
                    </div>

                    {/* Højde + Vægt */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label style={labelStyle}>Højde (cm)</label>
                        <input type="number" value={profile.height_cm || ""} onChange={e => p("height_cm", e.target.value ? parseInt(e.target.value) : null)}
                          style={inputStyle} placeholder="165" min={140} max={210} />
                      </div>
                      <div>
                        <label style={labelStyle}>Vægt (kg)</label>
                        <input type="number" value={profile.weight_kg || ""} onChange={e => p("weight_kg", e.target.value ? parseInt(e.target.value) : null)}
                          style={inputStyle} placeholder="55" min={40} max={150} />
                      </div>
                    </div>

                    {/* Etnicitet + Orientering */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label style={labelStyle}>Etnicitet</label>
                        <select value={profile.ethnicity || ""} onChange={e => p("ethnicity", e.target.value)} style={selectStyle}>
                          <option value="">Vælg...</option>
                          {ETHNICITY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={labelStyle}>Orientering</label>
                        <select value={profile.orientation || ""} onChange={e => p("orientation", e.target.value)} style={selectStyle}>
                          <option value="">Vælg...</option>
                          {ORIENTATION_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </div>
                    </div>

                    {/* Øjenfarve + Hårfarve */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label style={labelStyle}>Øjenfarve</label>
                        <select value={profile.eye_color || ""} onChange={e => p("eye_color", e.target.value)} style={selectStyle}>
                          <option value="">Vælg...</option>
                          {EYE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={labelStyle}>Hårfarve</label>
                        <select value={profile.hair_color || ""} onChange={e => p("hair_color", e.target.value)} style={selectStyle}>
                          <option value="">Vælg...</option>
                          {HAIR_COLOR_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </div>
                    </div>

                    {/* Hårlængde + Skambehåring */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label style={labelStyle}>Hårlængde</label>
                        <select value={profile.hair_length || ""} onChange={e => p("hair_length", e.target.value)} style={selectStyle}>
                          <option value="">Vælg...</option>
                          {HAIR_LENGTH_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={labelStyle}>Skambehåring</label>
                        <select value={profile.pubic_hair || ""} onChange={e => p("pubic_hair", e.target.value)} style={selectStyle}>
                          <option value="">Vælg...</option>
                          {PUBIC_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </div>
                    </div>

                    {/* Bryststørrelse + Brysttype */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label style={labelStyle}>Bryststørrelse</label>
                        <select value={profile.bust_size || ""} onChange={e => p("bust_size", e.target.value)} style={selectStyle}>
                          <option value="">Vælg...</option>
                          {BUST_SIZE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={labelStyle}>Brysttype</label>
                        <select value={profile.bust_type || ""} onChange={e => p("bust_type", e.target.value)} style={selectStyle}>
                          <option value="">Vælg...</option>
                          {BUST_TYPE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </div>
                    </div>

                    {/* Ryger + Tatoveringer + Piercinger */}
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label style={labelStyle}>Ryger</label>
                        <select value={profile.smoker || ""} onChange={e => p("smoker", e.target.value)} style={selectStyle}>
                          <option value="">Vælg...</option>
                          {SMOKER_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={labelStyle}>Tatoveringer</label>
                        <select value={profile.tattoo || ""} onChange={e => p("tattoo", e.target.value)} style={selectStyle}>
                          <option value="">Vælg...</option>
                          {TATTOO_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={labelStyle}>Piercinger</label>
                        <select value={profile.piercing || ""} onChange={e => p("piercing", e.target.value)} style={selectStyle}>
                          <option value="">Vælg...</option>
                          {PIERCING_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </div>
                    </div>

                    {/* Tilgængelig for */}
                    <div>
                      <label style={labelStyle}>Tilgængelig for</label>
                      <select value={profile.available_for || ""} onChange={e => p("available_for", e.target.value)} style={selectStyle}>
                        <option value="">Vælg...</option>
                        {AVAILABLE_FOR_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>

                    {/* Mødes med + Rejser */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label style={labelStyle}>Mødes med</label>
                        <select value={profile.meeting_with || ""} onChange={e => p("meeting_with", e.target.value)} style={selectStyle}>
                          <option value="">Vælg...</option>
                          {MEETING_WITH_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={labelStyle}>Rejser</label>
                        <select value={profile.travel || ""} onChange={e => p("travel", e.target.value)} style={selectStyle}>
                          <option value="">Vælg...</option>
                          {TRAVEL_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </div>
                    </div>

                    {/* ── Priser ── */}
                    <div style={{ borderTop: "1px solid #F3F4F6", paddingTop: 16 }}>
                      <p style={{ fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 12 }}>💰 Priser (DKK)</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label style={labelStyle}>1 time</label>
                          <input type="number" value={profile.rate_1hour || ""} onChange={e => p("rate_1hour", e.target.value ? parseInt(e.target.value) : null)}
                            style={inputStyle} placeholder="f.eks. 1200" min={0} />
                        </div>
                        <div>
                          <label style={labelStyle}>2 timer</label>
                          <input type="number" value={profile.rate_2hours || ""} onChange={e => p("rate_2hours", e.target.value ? parseInt(e.target.value) : null)}
                            style={inputStyle} placeholder="f.eks. 2000" min={0} />
                        </div>
                        <div>
                          <label style={labelStyle}>Overnatning</label>
                          <input type="number" value={profile.rate_overnight || ""} onChange={e => p("rate_overnight", e.target.value ? parseInt(e.target.value) : null)}
                            style={inputStyle} placeholder="f.eks. 5000" min={0} />
                        </div>
                        <div>
                          <label style={labelStyle}>Weekend</label>
                          <input type="number" value={profile.rate_weekend || ""} onChange={e => p("rate_weekend", e.target.value ? parseInt(e.target.value) : null)}
                            style={inputStyle} placeholder="f.eks. 8000" min={0} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Kilde URL */}
              {profile.source_url && (
                <div>
                  <label style={labelStyle}>Kilde URL</label>
                  <input type="text" value={profile.source_url} readOnly style={{ ...inputStyle, background: "#F9FAFB", color: "#6B7280" }} />
                </div>
              )}

              {/* Billeder */}
              {profile.images.length > 0 && (
                <div>
                  <label style={labelStyle}>Billeder ({profile.images.length})</label>
                  <div className="flex gap-2 flex-wrap">
                    {profile.images.map((src, i) => (
                      <img key={i} src={src} alt="" className="rounded-lg object-cover" style={{ width: 80, height: 80, border: "1px solid #E5E5E5" }} />
                    ))}
                  </div>
                </div>
              )}

              {/* Videoer */}
              {profile.videos && profile.videos.length > 0 && (
                <div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                    <label style={{ ...labelStyle, marginBottom: 0 }}>Videoer ({profile.videos.length})</label>
                    <button onClick={() => p("videos", [])}
                      style={{ fontSize: 11, color: "#DC2626", fontWeight: 600, background: "#FEE2E2", border: "none", cursor: "pointer", padding: "3px 10px", borderRadius: 4 }}>
                      ✕ Spring videoer over
                    </button>
                  </div>
                  <div style={{ background: "#FFF7ED", border: "1px solid #FED7AA", borderRadius: 6, padding: "8px 12px", marginBottom: 8, fontSize: 12, color: "#92400E", display: "flex", gap: 6, alignItems: "flex-start" }}>
                    <span>⚠️</span>
                    <span>Disse videoer kan have vandmærke. Vandmærker fjernes automatisk via unwatermark.ai efter oprettelse.</span>
                  </div>
                  <div className="flex gap-3 flex-wrap">
                    {profile.videos.map((src, i) => {
                      const isProfileVid = profile.profile_video_url === src;
                      return (
                        <div key={i} style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "stretch", width: 160 }}>
                          {/* Video preview */}
                          <div style={{ position: "relative" }}>
                            <video src={`${src}#t=1`} style={{
                              width: 160, height: 120, borderRadius: 8, background: "#000", display: "block",
                              border: isProfileVid ? "3px solid #DC2626" : "1px solid #E5E5E5",
                            }} />
                            {/* ✕ fjern */}
                            <button onClick={() => { p("videos", profile.videos.filter((_, idx) => idx !== i)); if (isProfileVid) p("profile_video_url", null); }}
                              style={{ position: "absolute", top: 6, right: 6, width: 22, height: 22, borderRadius: "50%", background: "#DC2626", color: "#fff", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}>
                              ✕
                            </button>
                            {/* LIVE badge når valgt */}
                            {isProfileVid && (
                              <div style={{ position: "absolute", top: 6, left: 6, background: "#DC2626", color: "#fff", fontSize: 9, fontWeight: 800, padding: "2px 6px", borderRadius: 3, letterSpacing: "0.5px" }}>
                                🎬 LIVE
                              </div>
                            )}
                          </div>
                          {/* Knap UNDER videoen */}
                          <button
                            onClick={() => p("profile_video_url", isProfileVid ? null : src)}
                            style={{
                              width: "100%", padding: "6px 8px", fontSize: 11, fontWeight: 700,
                              border: isProfileVid ? "none" : "1.5px solid #E5E5E5",
                              borderRadius: 6, cursor: "pointer",
                              background: isProfileVid ? "#DC2626" : "#fff",
                              color: isProfileVid ? "#fff" : "#374151",
                            }}>
                            {isProfileVid ? "✓ Profilbillede valgt" : "🎬 Vælg som profilbillede"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Stories */}
              {profile.stories && profile.stories.length > 0 && (
                <div>
                  <label style={labelStyle}>Stories ({profile.stories.length})</label>
                  <div className="flex gap-2 flex-wrap">
                    {profile.stories.map((s, i) => (
                      <div key={i} style={{ width: 64, height: 64 }}>
                        <img src={s.thumbnail_url || s.media_url} alt=""
                          style={{ width: 64, height: 64, objectFit: "cover", borderRadius: "50%", border: "2px solid #DC2626" }} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SMS toggle */}
              <div className="flex items-center justify-between pt-4" style={{ borderTop: "1px solid #F3F4F6" }}>
                <div>
                  <p className="text-[13px] font-semibold text-gray-900">Send SMS med login info</p>
                  <p className="text-[11px] text-gray-400">Sender email, kode og GRATIS30 promo til brugerens telefon</p>
                </div>
                <button onClick={() => setSendSMS(!sendSMS)} className="relative w-10 h-5 rounded-full transition-colors" style={{ background: sendSMS ? "#000" : "#D1D5DB" }}>
                  <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform" style={{ left: 2, transform: sendSMS ? "translateX(20px)" : "translateX(0)" }} />
                </button>
              </div>
            </div>

            {/* Sociale medier + Video */}
            <div className="bg-white rounded-xl p-6" style={{ border: "1px solid #E5E5E5" }}>
              <p className="text-[13px] font-semibold text-gray-900 mb-4">Kontakt & Sociale Medier</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label style={labelStyle}>Telegram</label>
                  <div style={{ display: "flex", alignItems: "center", border: "1px solid #E5E7EB", borderRadius: 8, overflow: "hidden" }}>
                    <span style={{ padding: "0 10px", color: "#6B7280", fontSize: 13, background: "#F9FAFB", borderRight: "1px solid #E5E7EB", height: 40, display: "flex", alignItems: "center" }}>@</span>
                    <input type="text" value={profile.telegram || ""} onChange={e => p("telegram", e.target.value)}
                      placeholder="username" style={{ flex: 1, height: 40, padding: "0 12px", border: "none", outline: "none", fontSize: 13 }} />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>WhatsApp</label>
                  <input type="text" value={profile.whatsapp || ""} onChange={e => p("whatsapp", e.target.value)}
                    placeholder="+45 XX XX XX XX" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Signal</label>
                  <input type="text" value={profile.signal || ""} onChange={e => p("signal", e.target.value)}
                    placeholder="+45 XX XX XX XX" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Viber</label>
                  <input type="text" value={profile.viber || ""} onChange={e => p("viber", e.target.value)}
                    placeholder="+45 XX XX XX XX" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>WeChat ID</label>
                  <input type="text" value={profile.wechat || ""} onChange={e => p("wechat", e.target.value)}
                    placeholder="WeChat ID" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>LINE App ID</label>
                  <input type="text" value={profile.line_app || ""} onChange={e => p("line_app", e.target.value)}
                    placeholder="LINE ID" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Video URL (mp4)</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input type="url" value={profile.video_url || ""} onChange={e => { p("video_url", e.target.value); setVideoImportMsg(""); }}
                      placeholder="https://..." style={{ ...inputStyle, flex: 1 }} />
                    {profile.video_url && !profile.video_url.includes("cloudinary") && (
                      <a
                        href={profile.video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ height: 40, padding: "0 14px", borderRadius: 8, background: "#111", color: "#fff", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", display: "flex", alignItems: "center", textDecoration: "none" }}
                      >
                        Åbn video
                      </a>
                    )}
                    {profile.video_url && profile.video_url.includes("cloudinary") && (
                      <button
                        onClick={async () => {
                          setDewatermarking(true); setVideoImportMsg("Fjerner vandmærke...");
                          try {
                            const r = await fetch("/api/admin/dewatermark-video", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ url: profile.video_url }),
                            });
                            const d = await r.json();
                            if (!r.ok) throw new Error(d.error);
                            p("video_url", d.url);
                            p("videos", [...(profile.videos || []).filter((v: string) => v !== profile.video_url), d.url]);
                            setVideoImportMsg("✓ Vandmærke fjernet");
                          } catch (e: unknown) {
                            setVideoImportMsg(e instanceof Error ? e.message : "Fejl");
                          } finally { setDewatermarking(false); }
                        }}
                        disabled={dewatermarking}
                        style={{ height: 40, padding: "0 14px", borderRadius: 8, background: "#DC2626", color: "#fff", border: "none", fontSize: 12, fontWeight: 600, cursor: dewatermarking ? "not-allowed" : "pointer", whiteSpace: "nowrap", opacity: dewatermarking ? 0.6 : 1 }}
                      >
                        {dewatermarking ? "Behandler..." : "Fjern vandmærke"}
                      </button>
                    )}
                  </div>
                    {/* Video fil-upload */}
                  <div style={{ marginTop: 8 }}>
                    <label style={{ fontSize: 12, color: "#6B7280", display: "block", marginBottom: 4 }}>Eller upload video fil direkte:</label>
                    <input
                      type="file"
                      accept="video/mp4,video/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setVideoImportMsg("Uploader video...");
                        const formData = new FormData();
                        formData.append("file", file);
                        try {
                          const r = await fetch("/api/admin/upload-video", { method: "POST", body: formData });
                          const d = await r.json();
                          if (!r.ok) throw new Error(d.error);
                          p("video_url", d.url);
                          p("videos", [...(profile.videos || []), d.url]);
                          setVideoImportMsg("✓ Video uploadet — klik 'Fjern vandmærke' eller sæt som profil billede");
                        } catch (err: unknown) {
                          setVideoImportMsg(err instanceof Error ? err.message : "Upload fejlede");
                        }
                      }}
                      style={{ fontSize: 12, color: "#374151" }}
                    />
                  </div>
                {videoImportMsg && <p style={{ fontSize: 12, marginTop: 6, color: videoImportMsg.startsWith("✓") ? "#16A34A" : "#DC2626" }}>{videoImportMsg}</p>}
                  {profile.video_url && profile.video_url.includes("supabase") && (
                    <video src={profile.video_url} controls style={{ width: "100%", marginTop: 8, borderRadius: 8, maxHeight: 200 }} />
                  )}
                </div>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="mt-4 p-4 rounded-xl" style={{ border: "1px solid #E5E5E5" }}>
              <p className="text-[13px] font-semibold text-gray-900 mb-3">Payment Methods</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: "revolut", label: "Revolut" },
                  { id: "cash", label: "Cash" },
                  { id: "redcoins", label: "Red Coins" },
                  { id: "crypto", label: "Crypto" },
                ].map(opt => {
                  const selected = (profile.payment_methods || []).includes(opt.id);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        const current = profile.payment_methods || [];
                        p("payment_methods", selected ? current.filter(x => x !== opt.id) : [...current, opt.id]);
                      }}
                      className="px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all"
                      style={{
                        background: selected ? "#DC2626" : "#F3F4F6",
                        color: selected ? "#fff" : "#374151",
                        border: selected ? "1px solid #DC2626" : "1px solid #E5E7EB",
                      }}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* OnlyFans Profile */}
            <div className="mt-4 p-4 rounded-xl" style={{ border: "1px solid #E5E5E5" }}>
              <p className="text-[13px] font-semibold text-gray-900 mb-3">OnlyFans Profile</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label style={labelStyle}>OnlyFans username</label>
                  <div style={{ display: "flex", alignItems: "center", border: "1px solid #E5E5E5", borderRadius: 8, overflow: "hidden" }}>
                    <span style={{ padding: "10px 8px 10px 12px", fontSize: 13, color: "#9CA3AF", background: "#F9FAFB", borderRight: "1px solid #E5E5E5" }}>@</span>
                    <input
                      type="text"
                      value={profile.onlyfans_username || ""}
                      onChange={e => p("onlyfans_username", e.target.value)}
                      style={{ flex: 1, padding: "10px 12px", fontSize: 13, border: "none", outline: "none", background: "transparent" }}
                      placeholder="username"
                    />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Monthly price ($)</label>
                  <input
                    type="number"
                    value={profile.onlyfans_price_usd ?? ""}
                    onChange={e => p("onlyfans_price_usd", e.target.value ? parseFloat(e.target.value) : null)}
                    style={inputStyle}
                    placeholder="9.99"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setStep(1)} className="px-4 py-2.5 rounded-lg text-[13px] font-medium" style={{ border: "1px solid #E5E5E5", color: "#6B7280" }}>
                Tilbage
              </button>
              <button onClick={handleCreate} disabled={creating} className="flex-1 px-4 py-2.5 rounded-lg text-[13px] font-semibold"
                style={{ background: creating ? "#E5E5E5" : "#000", color: creating ? "#9CA3AF" : "#fff", cursor: creating ? "not-allowed" : "pointer" }}>
                {creating ? <span className="flex items-center justify-center gap-2"><span className="w-3.5 h-3.5 border-2 border-gray-400 border-t-white rounded-full animate-spin" />Opretter...</span> : "Opret profil"}
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3 ── */}
        {step === 3 && result && (
          <div className="bg-white rounded-xl p-6" style={{ border: "1px solid #E5E5E5" }}>
            <div className="flex items-center gap-3 mb-5 pb-5" style={{ borderBottom: "1px solid #F3F4F6" }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-[18px]" style={{ background: "#DCFCE7" }}>✓</div>
              <div>
                <p className="text-[15px] font-bold text-gray-900">Profil oprettet</p>
                <p className="text-[12px] text-gray-400">Bruger er klar til at logge ind</p>
              </div>
            </div>

            <div className="space-y-2 mb-5">
              {[
                { label: "Login ID", value: result.loginId || result.email },
                { label: "Email", value: result.email },
                { label: "Adgangskode", value: result.password },
                { label: "SMS", value: result.smsStatus === "sent" ? "Sendt" : "Ikke sendt" },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between py-2 px-3 rounded-lg" style={{ background: "#F9FAFB" }}>
                  <span className="text-[12px] font-semibold text-gray-500 w-28">{row.label}</span>
                  <span className="text-[13px] font-mono text-gray-900 flex-1 text-right pr-2 truncate">{row.value}</span>
                  <button onClick={() => navigator.clipboard.writeText(row.value)} className="text-[11px] px-2 py-1 rounded border border-gray-200 text-gray-500 hover:bg-gray-100 flex-shrink-0">Kopi</button>
                </div>
              ))}
            </div>

            {/* Dewatermark status */}
            {result.videoIds && result.videoIds.length > 0 && (
              <div style={{ background: "#F9FAFB", borderRadius: 8, padding: "12px 14px", marginBottom: 16 }}>
                <p className="text-[12px] font-semibold text-gray-700 mb-2">🎬 Vandmærke fjernelse</p>
                {result.videoIds.map((v, i) => {
                  const s = dewatermarkStatus[v.id] || "waiting";
                  const label = s === "waiting" ? "⏳ Afventer..." : s === "starting" ? "🔄 Starter job..." : s === "processing" || s.startsWith("job:") ? "⚙️ Behandler..." : s === "done" ? "✅ Vandmærke fjernet" : s === "failed" ? "❌ Fejlede" : s === "timeout" ? "⏰ Timeout" : s === "error" ? "❌ Fejl" : s;
                  return (
                    <div key={v.id} className="flex items-center gap-2 text-[12px] text-gray-600">
                      <span>Video {i + 1}:</span>
                      <span style={{ color: s === "done" ? "#16A34A" : s.includes("fail") || s === "error" ? "#DC2626" : "#6B7280" }}>{label}</span>
                    </div>
                  );
                })}
                <p className="text-[11px] text-gray-400 mt-2">Vandmærker fjernes automatisk — det tager typisk 2–5 minutter per video</p>
              </div>
            )}

            <button onClick={() => { const t = `Login info:\nEmail: ${result.email}\nKode: ${result.password}`; navigator.clipboard.writeText(t); }}
              className="w-full mb-3 px-4 py-2.5 rounded-lg text-[13px] font-semibold border border-gray-200" style={{ background: "#F9FAFB", color: "#111" }}>
              Kopiér alle login info
            </button>
            <button onClick={reset} className="w-full px-4 py-2.5 rounded-lg text-[13px] font-semibold" style={{ background: "#000", color: "#fff" }}>
              Opret ny profil
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
