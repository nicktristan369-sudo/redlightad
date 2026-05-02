import { Plane } from "lucide-react";

export interface TravelEntry {
  id: string;
  from_date: string;
  to_date: string;
  city: string;
  country: string;
}

function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("da-DK", { day: "numeric", month: "short" });
}

export default function TravelBox({ entries }: { entries: TravelEntry[] }) {
  if (!entries || entries.length === 0) return null;

  // Only show upcoming / current entries
  const today = new Date().toISOString().split("T")[0];
  const upcoming = entries.filter(e => e.to_date >= today);
  if (upcoming.length === 0) return null;

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm" style={{ border: "1px solid #E5E5E5" }}>
      <div className="flex items-center gap-2 mb-4">
        <Plane size={16} color="#374151" strokeWidth={1.8} />
        <h3 className="text-[15px] font-bold text-gray-900">Upcoming Destinations</h3>
      </div>
      <div className="space-y-2">
        {upcoming.map(e => (
          <div key={e.id} className="flex items-center gap-2 text-[14px] text-gray-700">
            <span className="text-gray-500 flex-shrink-0">•</span>
            <span className="text-gray-500 flex-shrink-0 whitespace-nowrap">
              {formatDate(e.from_date)} – {formatDate(e.to_date)}
            </span>
            <span className="text-gray-300">→</span>
            <span className="font-medium">{e.city}, {e.country}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
