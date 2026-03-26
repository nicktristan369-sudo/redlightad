"use client";

import { useEffect, useState } from "react";
import { MapPin, Plane } from "lucide-react";

interface TravelEntry {
  id: string;
  country: string;
  city: string;
  country_code: string;
  arrival_date: string;
  departure_date: string;
  is_current: boolean;
}

function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function TravelScheduleSection({ listingId }: { listingId: string }) {
  const [entries, setEntries] = useState<TravelEntry[]>([]);

  useEffect(() => {
    fetch(`/api/travel?listing_id=${listingId}`)
      .then(r => r.json())
      .then(d => { if (d.entries) setEntries(d.entries); })
      .catch(() => {});
  }, [listingId]);

  if (entries.length === 0) return null;

  return (
    <div style={{ background: "#111", color: "#fff", padding: 20 }}>
      <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: "#fff", margin: "0 0 16px 0" }}>
        Travels
      </h3>
      <div>
        {entries.map((e, i) => (
          <div
            key={e.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "12px 0",
              borderBottom: i < entries.length - 1 ? "1px solid #222" : "none",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {e.is_current ? (
                <MapPin size={16} color="#DC2626" />
              ) : (
                <Plane size={14} color="#aaa" />
              )}
              <span style={{ fontWeight: e.is_current ? 600 : 400, fontSize: 14 }}>
                {e.is_current && (
                  <span style={{
                    background: "#DC2626",
                    color: "#fff",
                    fontSize: 10,
                    fontWeight: 600,
                    padding: "2px 6px",
                    marginRight: 8,
                  }}>
                    Current
                  </span>
                )}
                {e.city}, {e.country}
              </span>
            </div>
            {!e.is_current && (
              <span style={{ fontSize: 12, color: "#666", textAlign: "right" }}>
                {formatDate(e.arrival_date)} — {formatDate(e.departure_date)}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
