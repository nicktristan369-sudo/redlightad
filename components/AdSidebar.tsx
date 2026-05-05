"use client"
import { useLanguage } from "@/lib/i18n/LanguageContext";
import RatesPanel from "./RatesPanel";

interface AdSidebarProps {
  age: number;
  gender: string;
  category: string;
  city: string;
  country: string;
  languages: string[];
  rates: { duration: string; price: string }[];
  listingId?: string;
  // Ekstra profilfelter (valgfrie)
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
  body_build?: string | null;
}

function cmToFeet(cm: number): string {
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return `${feet}'${inches}"`;
}

export default function AdSidebar({
  age, gender, category, city, country, languages, rates, listingId,
  height_cm, weight_kg, ethnicity, eye_color, hair_color, hair_length,
  pubic_hair, bust_size, bust_type, orientation, smoker, tattoo,
  piercing, nationality, available_for, meeting_with, travel, body_build,
}: AdSidebarProps) {
  const { t } = useLanguage();

  // Group fields into sections
  const basicInfo = [
    { label: t.sidebar_age, value: age ? `${age}` : null },
    { label: t.sidebar_gender, value: gender },
    { label: t.sidebar_category, value: category },
    { label: t.sidebar_location, value: [city, country].filter(Boolean).join(", ") },
    { label: t.sidebar_languages, value: languages && languages.length > 0 ? [...new Set(languages)].join(", ") : null },
    { label: t.sidebar_nationality, value: nationality || null },
    { label: t.sidebar_ethnicity, value: ethnicity || null },
  ].filter(r => r.value);

  const appearance = [
    { label: t.sidebar_height, value: height_cm ? `${height_cm} cm / ${cmToFeet(height_cm)}` : null },
    { label: t.sidebar_weight, value: weight_kg ? `${weight_kg} kg / ${Math.round(weight_kg * 2.205)} lbs` : null },
    { label: "Body", value: body_build || null },
    { label: t.sidebar_eyes, value: eye_color || null },
    { label: t.sidebar_hair_color, value: hair_color || null },
    { label: t.sidebar_hair_length, value: hair_length || null },
    { label: t.sidebar_bust_size, value: bust_size || null },
    { label: t.sidebar_bust_type, value: bust_type || null },
  ].filter(r => r.value);

  const details = [
    { label: t.sidebar_orientation, value: orientation || null },
    { label: t.sidebar_pubic_hair, value: pubic_hair || null },
    { label: t.sidebar_smoker, value: smoker || null },
    { label: t.sidebar_tattoo, value: tattoo || null },
    { label: t.sidebar_piercing, value: piercing || null },
  ].filter(r => r.value);

  const availability = [
    { label: t.sidebar_available_for, value: available_for || null },
    { label: t.sidebar_meeting_with, value: meeting_with || null },
    { label: t.sidebar_travel, value: travel || null },
  ].filter(r => r.value);

  const InfoRow = ({ label, value }: { label: string; value: string }) => {
    // Try to parse as JSON array and format nicely, deduplicate
    let displayValue = value;
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        // Remove duplicates with Set
        displayValue = [...new Set(parsed)].join(", ");
      }
    } catch {
      // Not JSON, use as-is
    }
    return (
      <div className="flex items-center justify-between py-2.5">
        <span className="text-[13px] text-gray-500">{label}</span>
        <span className="text-[13px] font-medium text-gray-900 text-right max-w-[60%]">{displayValue}</span>
      </div>
    );
  };

  const Section = ({ title, rows }: { title?: string; rows: { label: string; value: string | null }[] }) => {
    if (rows.length === 0) return null;
    return (
      <div className="px-5">
        {title && (
          <div className="pt-4 pb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">{title}</span>
          </div>
        )}
        <div className="divide-y divide-gray-100">
          {rows.map((row) => (
            <InfoRow key={row.label} label={row.label} value={row.value!} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white overflow-hidden" style={{ border: "1px solid #E5E7EB", borderRadius: 8 }}>
      {/* Header */}
      <div className="px-5 py-4" style={{ borderBottom: "1px solid #F3F4F6" }}>
        <h3 className="text-[15px] font-semibold text-gray-900 tracking-tight">{t.profile_info}</h3>
      </div>

      {/* Basic Info */}
      <Section rows={basicInfo} />

      {/* Appearance */}
      {appearance.length > 0 && (
        <>
          <div className="mx-5 my-1" style={{ height: 1, background: "#F3F4F6" }} />
          <Section title="Appearance" rows={appearance} />
        </>
      )}

      {/* Details */}
      {details.length > 0 && (
        <>
          <div className="mx-5 my-1" style={{ height: 1, background: "#F3F4F6" }} />
          <Section title="Details" rows={details} />
        </>
      )}

      {/* Availability */}
      {availability.length > 0 && (
        <>
          <div className="mx-5 my-1" style={{ height: 1, background: "#F3F4F6" }} />
          <Section title="Availability" rows={availability} />
        </>
      )}

      {/* Spacer before rates */}
      <div className="h-3" />

      {/* Rates */}
      {rates && rates.length > 0 && (
        <div style={{ borderTop: "1px solid #F3F4F6" }}>
          <RatesPanel rates={rates} listingId={listingId} />
        </div>
      )}
    </div>
  );
}
