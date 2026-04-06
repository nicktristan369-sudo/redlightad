"use client"
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { Cake, User, Folder, MapPin, Languages, Ruler, Globe, Heart, Eye, Cigarette, Zap, Flag } from "lucide-react";
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
  piercing, nationality, available_for, meeting_with, travel,
}: AdSidebarProps) {
  const { t } = useLanguage();

  const mainRows = [
    { icon: <Cake size={14} color="#9CA3AF" />,      label: t.sidebar_age,       value: age ? `${age}` : null },
    { icon: <User size={14} color="#9CA3AF" />,      label: t.sidebar_gender,    value: gender },
    { icon: <Folder size={14} color="#9CA3AF" />,    label: t.sidebar_category,  value: category },
    { icon: <MapPin size={14} color="#9CA3AF" />,    label: t.sidebar_location,  value: [city, country].filter(Boolean).join(", ") },
    { icon: <Languages size={14} color="#9CA3AF" />, label: t.sidebar_languages, value: languages?.join(", ") || null },
  ];

  const extraRows = [
    { label: t.sidebar_height,        value: height_cm   ? `${height_cm} cm / ${cmToFeet(height_cm)}` : null },
    { label: t.sidebar_weight,        value: weight_kg   ? `${weight_kg} kg / ${Math.round(weight_kg * 2.205)} lbs` : null },
    { label: t.sidebar_ethnicity,     value: ethnicity   || null },
    { label: t.sidebar_nationality,   value: nationality || null },
    { label: t.sidebar_orientation,   value: orientation || null },
    { label: t.sidebar_eyes,          value: eye_color   || null },
    { label: t.sidebar_hair_color,    value: hair_color  || null },
    { label: t.sidebar_hair_length,   value: hair_length || null },
    { label: t.sidebar_pubic_hair,    value: pubic_hair  || null },
    { label: t.sidebar_bust_size,     value: bust_size   || null },
    { label: t.sidebar_bust_type,     value: bust_type   || null },
    { label: t.sidebar_smoker,        value: smoker      || null },
    { label: t.sidebar_tattoo,        value: tattoo      || null },
    { label: t.sidebar_piercing,      value: piercing    || null },
    { label: t.sidebar_available_for, value: available_for || null },
    { label: t.sidebar_meeting_with,  value: meeting_with || null },
    { label: t.sidebar_travel,        value: travel      || null },
  ].filter(r => r.value);

  const allRows = [...mainRows.filter(r => r.value !== null && r.value !== ""), ...extraRows];

  return (
    <div className="rounded-xl bg-white shadow-md overflow-hidden" style={{ border: "1px solid #E5E7EB" }}>
      <div className="px-5 py-4 border-b border-gray-100">
        <h3 className="text-[15px] font-bold text-gray-900">{t.profile_info}</h3>
      </div>

      <div className="divide-y divide-gray-50">
        {allRows.map((row) => (
          <div key={row.label} className="flex items-center justify-between px-5 py-3">
            <span className="flex items-center gap-2">
              {"icon" in row && <span>{(row as typeof mainRows[0]).icon}</span>}
              {"icon" in row ? null : <span className="w-[14px]" />}
              <span className="text-[12px] font-semibold uppercase tracking-wide" style={{ color: "#DC2626" }}>
                {row.label}
              </span>
            </span>
            <span className="text-[13px] font-medium text-gray-800 text-right max-w-[55%] truncate">
              {row.value}
            </span>
          </div>
        ))}
      </div>

      {rates && rates.length > 0 && (
        <div className="p-0 border-t border-gray-100">
          <RatesPanel rates={rates} listingId={listingId} />
        </div>
      )}
    </div>
  );
}
