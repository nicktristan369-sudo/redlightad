"use client";

import { useState, useEffect, useRef } from "react";
import { MapPin, ChevronDown, Search, X, Loader2 } from "lucide-react";
import { SUPPORTED_COUNTRIES } from "@/lib/countries";

/**
 * GeoNames city data structure
 */
export interface GeoCity {
  geoname_id: number;
  name: string;
  ascii_name: string;
  country_code: string;
  admin1_name: string | null;
  latitude: number;
  longitude: number;
  population: number;
  is_major_city: boolean;
}

/**
 * Selected location with major city info
 */
export interface SelectedLocation {
  city: GeoCity;
  major_city: GeoCity | null;
  distance_km: number | null;
}

interface LocationPickerProps {
  /** Pre-selected country code (optional) */
  countryCode?: string;
  /** Callback when a city is selected */
  onSelect: (location: SelectedLocation) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Show country selector */
  showCountrySelector?: boolean;
  /** Required field */
  required?: boolean;
  /** Initial value (city name) */
  initialValue?: string;
  /** Disabled state */
  disabled?: boolean;
}

/**
 * Shared LocationPicker component using GeoNames data
 * 
 * Used in:
 * - Signup flow (/register/provider)
 * - Profile edit (/dashboard/profile)
 * - Travel (/dashboard/travel)
 * - Admin (/admin/users/[id])
 */
export default function LocationPicker({
  countryCode: initialCountryCode,
  onSelect,
  placeholder = "Search city...",
  showCountrySelector = true,
  required = false,
  initialValue = "",
  disabled = false,
}: LocationPickerProps) {
  // State
  const [countryCode, setCountryCode] = useState(initialCountryCode || "");
  const [search, setSearch] = useState(initialValue);
  const [results, setResults] = useState<GeoCity[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [selectedCity, setSelectedCity] = useState<GeoCity | null>(null);
  const [majorCity, setMajorCity] = useState<GeoCity | null>(null);
  
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Get country name from code
  const countryName = SUPPORTED_COUNTRIES.find(c => c.code.toUpperCase() === countryCode.toUpperCase())?.name || "";

  // Search cities when typing
  useEffect(() => {
    if (search.length < 2) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    searchTimeout.current = setTimeout(async () => {
      setLoading(true);
      try {
        const url = countryCode
          ? `/api/geo/search?q=${encodeURIComponent(search)}&country=${countryCode}&limit=15`
          : `/api/geo/search?q=${encodeURIComponent(search)}&limit=15`;
        
        const res = await fetch(url);
        const data = await res.json();
        setResults(data.results || []);
        setShowDropdown(true);
      } catch (err) {
        console.error("City search error:", err);
        setResults([]);
      }
      setLoading(false);
    }, 300);

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [search, countryCode]);

  // Find nearest major city when a city is selected
  const findNearestMajorCity = async (city: GeoCity) => {
    // If the selected city IS a major city, use it as major city too
    if (city.is_major_city) {
      return city;
    }

    try {
      const res = await fetch(
        `/api/geo/nearest-major?lat=${city.latitude}&lng=${city.longitude}&country=${city.country_code}`
      );
      const data = await res.json();
      return data.major_city || null;
    } catch (err) {
      console.error("Error finding nearest major city:", err);
      return null;
    }
  };

  // Handle city selection
  const handleSelectCity = async (city: GeoCity) => {
    setSearch(city.name);
    setSelectedCity(city);
    setShowDropdown(false);
    setResults([]);

    // Auto-set country if not set
    if (!countryCode) {
      setCountryCode(city.country_code);
    }

    // Find nearest major city
    setLoading(true);
    const major = await findNearestMajorCity(city);
    setMajorCity(major);
    setLoading(false);

    // Calculate distance if major city is different
    let distance: number | null = null;
    if (major && major.geoname_id !== city.geoname_id) {
      const toRad = (deg: number) => deg * Math.PI / 180;
      const R = 6371;
      const dLat = toRad(major.latitude - city.latitude);
      const dLon = toRad(major.longitude - city.longitude);
      const a = Math.sin(dLat / 2) ** 2 +
                Math.cos(toRad(city.latitude)) * Math.cos(toRad(major.latitude)) *
                Math.sin(dLon / 2) ** 2;
      distance = Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
    }

    // Callback
    onSelect({
      city,
      major_city: major,
      distance_km: distance,
    });
  };

  // Handle country selection
  const handleSelectCountry = (code: string) => {
    setCountryCode(code);
    setShowCountryDropdown(false);
    setSearch("");
    setSelectedCity(null);
    setMajorCity(null);
  };

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
        setShowCountryDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="space-y-3">
      {/* Country selector */}
      {showCountrySelector && (
        <div className="relative">
          <label className="block text-[13px] font-medium text-gray-500 uppercase tracking-wide mb-1.5">
            Country {required && <span className="text-red-600">*</span>}
          </label>
          <button
            type="button"
            onClick={() => setShowCountryDropdown(!showCountryDropdown)}
            disabled={disabled}
            className="w-full px-4 py-3 border border-gray-200 bg-white text-left flex items-center justify-between focus:outline-none focus:border-[#DC2626] transition-colors disabled:bg-gray-50 disabled:text-gray-500"
            style={{ borderRadius: 0 }}
          >
            <span className={countryCode ? "text-gray-900" : "text-gray-500"}>
              {countryCode ? (
                <span className="flex items-center gap-2">
                  <span className={`fi fi-${countryCode.toLowerCase()} fis`} style={{ width: 20, height: 15 }} />
                  {countryName}
                </span>
              ) : (
                "Select country..."
              )}
            </span>
            <ChevronDown size={18} className="text-gray-500" />
          </button>

          {/* Country dropdown */}
          {showCountryDropdown && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 shadow-lg max-h-60 overflow-y-auto">
              {SUPPORTED_COUNTRIES.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => handleSelectCountry(c.code)}
                  className={`w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center gap-2 border-b border-gray-100 last:border-0 ${
                    countryCode === c.code ? "bg-red-50 text-red-600 font-medium" : "text-gray-800"
                  }`}
                >
                  <span className={`fi fi-${c.code.toLowerCase()} fis`} style={{ width: 20, height: 15 }} />
                  {c.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* City search */}
      <div className="relative">
        <label className="block text-[13px] font-medium text-gray-500 uppercase tracking-wide mb-1.5">
          City {required && <span className="text-red-600">*</span>}
        </label>
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedCity(null);
              setMajorCity(null);
            }}
            onFocus={() => results.length > 0 && setShowDropdown(true)}
            placeholder={countryCode ? `Search city in ${countryName}...` : "Search any city worldwide..."}
            disabled={disabled}
            className="w-full px-4 py-3 pr-10 border border-gray-200 bg-white text-gray-900 focus:outline-none focus:border-[#DC2626] transition-colors disabled:bg-gray-50 disabled:text-gray-500"
            style={{ borderRadius: 0 }}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {loading ? (
              <Loader2 size={18} className="text-gray-500 animate-spin" />
            ) : (
              <Search size={18} className="text-gray-500" />
            )}
          </div>
        </div>

        {/* City dropdown */}
        {showDropdown && results.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 shadow-lg max-h-72 overflow-y-auto">
            {results.map((city) => (
              <button
                key={city.geoname_id}
                type="button"
                onClick={() => handleSelectCity(city)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-0"
              >
                <div className="flex items-start gap-3">
                  <MapPin size={16} className={city.is_major_city ? "text-red-500 mt-0.5" : "text-gray-500 mt-0.5"} />
                  <div>
                    <div className={city.is_major_city ? "font-semibold text-gray-900" : "text-gray-800"}>
                      {city.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {city.admin1_name && `${city.admin1_name}, `}
                      {SUPPORTED_COUNTRIES.find(c => c.code.toUpperCase() === city.country_code)?.name || city.country_code}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* No results */}
        {showDropdown && results.length === 0 && search.length >= 2 && !loading && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 shadow-lg p-4 text-center text-gray-500">
            No cities found for "{search}"
          </div>
        )}
      </div>

      {/* Show major city info */}
      {selectedCity && majorCity && majorCity.geoname_id !== selectedCity.geoname_id && (
        <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 border border-gray-200">
          <MapPin size={14} className="text-red-500" />
          <span>
            Will be shown in: <strong>{majorCity.name}</strong> area
          </span>
        </div>
      )}
    </div>
  );
}
