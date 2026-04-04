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

  const mainRows = [
    { icon: <Cake size={14} color="#9CA3AF" />,      label: "Age",       value: age ? `${age}` : null },
    { icon: <User size={14} color="#9CA3AF" />,      label: "Gender",    value: gender },
    { icon: <Folder size={14} color="#9CA3AF" />,    label: "Category",  value: category },
    { icon: <MapPin size={14} color="#9CA3AF" />,    label: "Location",  value: [city, country].filter(Boolean).join(", ") },
    { icon: <Languages size={14} color="#9CA3AF" />, label: "Languages", value: languages?.join(", ") || null },
  ];

  const extraRows = [
    { label: "Height",       value: height_cm   ? `${height_cm} cm / ${cmToFeet(height_cm)}` : null },
    { label: "Weight",       value: weight_kg   ? `${weight_kg} kg / ${Math.round(weight_kg * 2.205)} lbs` : null },
    { label: "Ethnicity",    value: ethnicity   || null },
    { label: "Nationality",  value: nationality || null },
    { label: "Orientation",  value: orientation || null },
    { label: "Eyes",         value: eye_color   || null },
    { label: "Hair color",   value: hair_color  || null },
    { label: "Hair length",  value: hair_length || null },
    { label: "Pubic hair",   value: pubic_hair  || null },
    { label: "Bust size",    value: bust_size   || null },
    { label: "Bust type",    value: bust_type   || null },
    { label: "Smoker",       value: smoker      || null },
    { label: "Tattoo",       value: tattoo      || null },
    { label: "Piercing",     value: piercing    || null },
    { label: "Available for",value: available_for || null },
    { label: "Meeting with", value: meeting_with || null },
    { label: "Travel",       value: travel      || null },
  ].filter(r => r.value);

  const allRows = [...mainRows.filter(r => r.value !== null && r.value !== ""), ...extraRows];

  return (
    <div className="rounded-xl bg-white shadow-md overflow-hidden" style={{ border: "1px solid #E5E7EB" }}>
      <div className="px-5 py-4 border-b border-gray-100">
        <h3 className="text-[15px] font-bold text-gray-900">Profile Info</h3>
      </div>

      <div className="divide-y divide-gray-50">
        {allRows.map((row) => (
          <div key={row.label} className="flex items-center justify-between px-5 py-2.5">
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
