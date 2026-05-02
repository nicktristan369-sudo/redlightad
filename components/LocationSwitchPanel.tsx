"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { MapPin, CheckCircle, Clock, Info } from "lucide-react";
import { SUPPORTED_COUNTRIES } from "@/lib/countries";

// Local type - no Google Maps dependency
interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting?: {
    main_text: string;
    secondary_text?: string;
  };
}

interface Props {
  listingId: string;
  currentCountry: string;
  currentCity: string;
  locationChangedAt: string | null;
  onSuccess: (country: string, city: string, lat?: number, lng?: number) => void;
  exactAddress?: string | null;
  exactLat?: number | null;
  exactLng?: number | null;
  onAddressChange?: (address: string | null, lat: number | null, lng: number | null) => void;
}

function msToHM(ms: number) {
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return `${h}h ${m}m`;
}

const COOLDOWN_MS = 24 * 60 * 60 * 1000;

export default function LocationSwitchPanel({
  listingId, currentCountry, currentCity, locationChangedAt, onSuccess,
  exactAddress, exactLat, exactLng, onAddressChange,
}: Props) {
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [remaining, setRemaining] = useState<number>(0);
  
  // Exact address
  const [showExactAddress, setShowExactAddress] = useState(!!exactAddress);
  const [addressInput, setAddressInput] = useState(exactAddress || "");
  const [addressSuggestions, setAddressSuggestions] = useState<PlacePrediction[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<{ address: string; lat: number; lng: number } | null>(
    exactAddress && exactLat && exactLng ? { address: exactAddress, lat: exactLat, lng: exactLng } : null
  );
  
  // City autocomplete
  const [citySuggestions, setCitySuggestions] = useState<PlacePrediction[]>([]);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const cityInputRef = useRef<HTMLInputElement>(null);
  const addressInputRef = useRef<HTMLInputElement>(null);

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

  // City autocomplete via API
  const searchCities = async (query: string, countryCode: string) => {
    if (!query || query.length < 2) {
      setCitySuggestions([]);
      return;
    }
    try {
      const res = await fetch(`/api/geo/places-autocomplete?input=${encodeURIComponent(query)}&types=(cities)&country=${countryCode}`);
      const data = await res.json();
      if (data.predictions) {
        setCitySuggestions(data.predictions);
        setShowCitySuggestions(true);
      }
    } catch {
      setCitySuggestions([]);
    }
  };

  // Address autocomplete via API
  const searchAddresses = async (query: string) => {
    if (!query || query.length < 3) {
      setAddressSuggestions([]);
      return;
    }
    try {
      const res = await fetch(`/api/geo/places-autocomplete?input=${encodeURIComponent(query)}&types=address`);
      const data = await res.json();
      if (data.predictions) {
        setAddressSuggestions(data.predictions);
      }
    } catch {
      setAddressSuggestions([]);
    }
  };

  // Get place details (lat/lng) from place_id
  const getPlaceDetails = async (placeId: string): Promise<{ lat: number; lng: number; formatted: string } | null> => {
    try {
      const res = await fetch(`/api/geo/place-details?place_id=${placeId}`);
      const data = await res.json();
      if (data.result?.geometry?.location) {
        return {
          lat: data.result.geometry.location.lat,
          lng: data.result.geometry.location.lng,
          formatted: data.result.formatted_address || "",
        };
      }
    } catch {}
    return null;
  };

  const handleCitySelect = async (prediction: PlacePrediction) => {
    setCity(prediction.structured_formatting?.main_text || prediction.description);
    setCitySuggestions([]);
    setShowCitySuggestions(false);
  };

  const handleAddressSelect = async (prediction: PlacePrediction) => {
    const details = await getPlaceDetails(prediction.place_id);
    if (details) {
      setSelectedAddress({ address: details.formatted, lat: details.lat, lng: details.lng });
      setAddressInput(details.formatted);
      setAddressSuggestions([]);
      onAddressChange?.(details.formatted, details.lat, details.lng);
    }
  };

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
          setError(json.error ?? "Something went wrong");
        }
        return;
      }
      setDone(true);
      onSuccess(country, city.trim(), json.latitude, json.longitude);
      setTimeout(() => setDone(false), 3000);
      setCountry(""); setCity("");
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const toggleExactAddress = (show: boolean) => {
    setShowExactAddress(show);
    if (!show) {
      setSelectedAddress(null);
      setAddressInput("");
      onAddressChange?.(null, null, null);
    }
  };

  // Get country code from name
  const getCountryCode = (name: string) => {
    const c = SUPPORTED_COUNTRIES.find(c => c.name === name);
    return c?.code?.toLowerCase() || "";
  };

  return (
    <div className="space-y-4">
      {/* Location Switch Panel */}
      <div className="rounded-xl border border-gray-200 p-4 space-y-3">
        {/* Current location */}
        <div className="flex items-center gap-2 text-[13px] text-gray-500">
          <MapPin size={14} color="#9CA3AF" />
          <span>Current: <strong className="text-gray-900">{[currentCity, currentCountry].filter(Boolean).join(", ") || "—"}</strong></span>
        </div>

        {onCooldown ? (
          /* Cooldown state */
          <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 flex items-center gap-3">
            <Clock size={16} color="#B45309" className="flex-shrink-0" />
            <div>
              <p className="text-[13px] font-semibold text-amber-900">Location already changed today</p>
              <p className="text-[12px] text-amber-700 mt-0.5">You can change again in <strong>{msToHM(remaining)}</strong></p>
            </div>
          </div>
        ) : done ? (
          <div className="rounded-xl bg-green-50 border border-green-100 px-4 py-3 flex items-center gap-2">
            <CheckCircle size={16} color="#16A34A" />
            <p className="text-[13px] font-semibold text-green-800">Location updated</p>
          </div>
        ) : (
          /* Switch form */
          <div className="space-y-2.5">
            <p className="text-[12px] text-gray-500">You can change your location once every 24 hours.</p>

            {/* Country selector */}
            <select
              value={country}
              onChange={e => { setCountry(e.target.value); setCity(""); setCitySuggestions([]); }}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-[13px] focus:outline-none bg-white text-gray-900"
            >
              <option value="">Select country…</option>
              {SUPPORTED_COUNTRIES.sort((a, b) => a.name.localeCompare(b.name)).map(c => (
                <option key={c.code} value={c.name}>{c.flag} {c.name}</option>
              ))}
            </select>

            {/* City input with autocomplete */}
            <div className="relative">
              <input
                ref={cityInputRef}
                type="text"
                value={city}
                onChange={e => {
                  setCity(e.target.value);
                  if (country) {
                    searchCities(e.target.value, getCountryCode(country));
                  }
                }}
                onFocus={() => citySuggestions.length > 0 && setShowCitySuggestions(true)}
                onBlur={() => setTimeout(() => setShowCitySuggestions(false), 200)}
                placeholder={country ? "Start typing city name..." : "Select country first"}
                disabled={!country}
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-[13px] focus:outline-none text-gray-900 placeholder-gray-400 disabled:bg-gray-50 disabled:text-gray-400"
              />
              {showCitySuggestions && citySuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                  {citySuggestions.map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleCitySelect(s)}
                      className="w-full px-3 py-2 text-left text-[13px] hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-gray-900">{s.structured_formatting?.main_text}</span>
                      <span className="text-gray-400 text-[11px] ml-2">{s.structured_formatting?.secondary_text}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {error && <p className="text-[12px] text-red-500">{error}</p>}

            <button
              onClick={handleSave}
              disabled={saving || !country || !city.trim()}
              className="w-full py-2.5 rounded-xl text-[13px] font-semibold text-white transition-colors disabled:opacity-50"
              style={{ background: "#000" }}
            >
              {saving ? "Saving…" : "Change location"}
            </button>
          </div>
        )}
      </div>

      {/* Exact Address Feature */}
      <div className="rounded-xl border border-gray-200 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[13px] font-semibold text-gray-900">Show exact address</p>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={showExactAddress}
              onChange={e => toggleExactAddress(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:bg-green-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
          </label>
        </div>

        {showExactAddress && (
          <>
            {/* Address input */}
            <div className="relative">
              <input
                ref={addressInputRef}
                type="text"
                value={addressInput}
                onChange={e => {
                  setAddressInput(e.target.value);
                  searchAddresses(e.target.value);
                }}
                placeholder="Start typing your address..."
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-[13px] focus:outline-none text-gray-900 placeholder-gray-400"
              />
              {addressSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                  {addressSuggestions.map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleAddressSelect(s)}
                      className="w-full px-3 py-2 text-left text-[13px] hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-gray-900">{s.structured_formatting?.main_text}</span>
                      <span className="text-gray-400 text-[11px] ml-2">{s.structured_formatting?.secondary_text}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Map preview */}
            {selectedAddress && (
              <a
                href={`https://www.google.com/maps?q=${selectedAddress.lat},${selectedAddress.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <img
                  src={`/api/geo/static-map?lat=${selectedAddress.lat}&lng=${selectedAddress.lng}&zoom=15&size=400x150`}
                  alt="Location preview"
                  className="w-full h-[120px] object-cover rounded-xl border border-gray-200"
                />
              </a>
            )}

            {/* Info box */}
            <div className="rounded-xl bg-blue-50 border border-blue-100 p-3">
              <div className="flex gap-2">
                <Info size={14} className="text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-[12px] text-blue-800 space-y-1">
                  <p className="font-semibold">How address sharing works</p>
                  <ul className="list-disc ml-4 space-y-0.5 text-blue-700">
                    <li>Your exact address will be shown as a small map preview on your profile</li>
                    <li>Visitors can tap the map to open Google Maps and get directions</li>
                    <li>Only your street and area are shown — apartment/door number is NOT displayed</li>
                    <li>You can turn this off at any time</li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
