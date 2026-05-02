"use client";

import { useState, useEffect, useCallback } from "react";
import { MapPin, CheckCircle, Clock } from "lucide-react";
import { SUPPORTED_COUNTRIES } from "@/lib/countries";

interface Props {
  listingId: string;
  currentCountry: string;
  currentCity: string;
  locationChangedAt: string | null;
  onSuccess: (country: string, city: string) => void;
}

function msToHM(ms: number) {
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return `${h} t ${m} min`;
}

const COOLDOWN_MS = 24 * 60 * 60 * 1000;

export default function LocationSwitchPanel({
  listingId, currentCountry, currentCity, locationChangedAt, onSuccess,
}: Props) {
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [remaining, setRemaining] = useState<number>(0);

  const calcRemaining = useCallback(() => {
    if (!locationChangedAt) return 0;
    const elapsed = Date.now() - new Date(locationChangedAt).getTime();
    return Math.max(0, COOLDOWN_MS - elapsed);
  }, [locationChangedAt]);

  useEffect(() => {
    const r = calcRemaining();
    setRemaining(r);
    if (r <= 0) return;
    const interval = setInterval(() => {
      const next = calcRemaining();
      setRemaining(next);
      if (next <= 0) clearInterval(interval);
    }, 60_000);
    return () => clearInterval(interval);
  }, [calcRemaining]);

  const onCooldown = remaining > 0;

  const handleSave = async () => {
    if (!country || !city.trim()) { setError("Select country and city"); return; }
    setSaving(true); setError("");
    try {
      const res = await fetch(`/api/listings/${listingId}/location`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country, city: city.trim() }),
      });
      const json = await res.json();
      if (!res.ok) {
        if (json.error === "cooldown") {
          setRemaining(json.remaining_ms);
        } else {
          setError(json.error ?? "Noget gik galt");
        }
        return;
      }
      setDone(true);
      onSuccess(country, city.trim());
      setTimeout(() => setDone(false), 3000);
      setCountry(""); setCity("");
    } catch {
      setError("Noget gik galt. Prøv igen.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 p-4 space-y-3">
      {/* Current location */}
      <div className="flex items-center gap-2 text-[13px] text-gray-500">
        <MapPin size={14} color="#9CA3AF" />
        <span>Nuværende: <strong className="text-gray-900">{[currentCity, currentCountry].filter(Boolean).join(", ") || "—"}</strong></span>
      </div>

      {onCooldown ? (
        /* Cooldown state */
        <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 flex items-center gap-3">
          <Clock size={16} color="#B45309" className="flex-shrink-0" />
          <div>
            <p className="text-[13px] font-semibold text-amber-900">Lokation allerede skiftet i dag</p>
            <p className="text-[12px] text-amber-700 mt-0.5">Du kan skifte igen om <strong>{msToHM(remaining)}</strong></p>
          </div>
        </div>
      ) : done ? (
        <div className="rounded-xl bg-green-50 border border-green-100 px-4 py-3 flex items-center gap-2">
          <CheckCircle size={16} color="#16A34A" />
          <p className="text-[13px] font-semibold text-green-800">Lokation opdateret</p>
        </div>
      ) : (
        /* Switch form */
        <div className="space-y-2.5">
          <p className="text-[12px] text-gray-500">Du kan skifte din lokation 1 gang per 24 timer.</p>

          {/* Country selector */}
          <select
            value={country}
            onChange={e => setCountry(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-[13px] focus:outline-none bg-white text-gray-900"
          >
            <option value="">Select country…</option>
            {SUPPORTED_COUNTRIES.sort((a, b) => a.name.localeCompare(b.name)).map(c => (
              <option key={c.code} value={c.name}>{c.flag} {c.name}</option>
            ))}
          </select>

          {/* City input */}
          <input
            type="text"
            value={city}
            onChange={e => setCity(e.target.value)}
            placeholder="By (fx København)"
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-[13px] focus:outline-none text-gray-900 placeholder-gray-400"
          />

          {error && <p className="text-[12px] text-red-500">{error}</p>}

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-2.5 rounded-xl text-[13px] font-semibold text-white transition-colors disabled:opacity-50"
            style={{ background: "#000" }}
          >
            {saving ? "Saving…" : "Change location"}
          </button>
        </div>
      )}
    </div>
  );
}
