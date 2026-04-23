"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  MapPin,
  Search,
  ChevronDown,
  ChevronLeft,
  X,
  Globe,
  Building2,
  Navigation,
  Loader2,
  Star,
} from "lucide-react";

// ============================================================================
// Types
// ============================================================================

interface City {
  id: number;
  geoname_id: number;
  name: string;
  ascii_name: string;
  latitude: number;
  longitude: number;
  population: number;
  is_major_city: boolean;
  is_capital: boolean;
  region: { id: number; name: string } | null;
  country: {
    id: number;
    name: string;
    name_local: string;
    iso_code: string;
  } | null;
  display_name: string;
}

interface Country {
  id: number;
  name: string;
  name_local: string;
  iso_code: string;
  continent: string;
  listing_count?: number;
}

interface Region {
  id: number;
  name: string;
  ascii_name: string;
  cities?: City[];
}

interface LocationValue {
  city?: City;
  cityName?: string;
  regionName?: string;
  countryCode?: string;
  countryName?: string;
  latitude?: number;
  longitude?: number;
}

interface Props {
  value?: LocationValue;
  countryCode?: string;
  onChange: (location: LocationValue | null) => void;
  placeholder?: string;
  className?: string;
  showCountrySelector?: boolean;
  mode?: "search" | "select"; // search = autocomplete, select = browse
}

// ============================================================================
// Component
// ============================================================================

export default function GeoLocationPicker({
  value,
  countryCode,
  onChange,
  placeholder = "Search city...",
  className = "",
  showCountrySelector = true,
  mode = "search",
}: Props) {
  // State
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"search" | "countries" | "regions" | "cities">("search");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Data
  const [searchResults, setSearchResults] = useState<City[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  
  // Selection state
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  
  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // ============================================================================
  // Effects
  // ============================================================================

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open && inputRef.current && view === "search") {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open, view]);

  // Initialize with country code
  useEffect(() => {
    if (countryCode && !selectedCountry) {
      // Set initial country from code
      fetchCountries().then((countries) => {
        const country = countries.find((c) => c.iso_code === countryCode);
        if (country) {
          setSelectedCountry(country);
        }
      });
    }
  }, [countryCode]);

  // ============================================================================
  // API Calls
  // ============================================================================

  const fetchCountries = useCallback(async (): Promise<Country[]> => {
    try {
      const res = await fetch("/api/geo/countries?has_listings=true");
      const data = await res.json();
      const countries = data.countries || [];
      setCountries(countries);
      return countries;
    } catch (err) {
      console.error("Failed to fetch countries:", err);
      return [];
    }
  }, []);

  const fetchRegions = useCallback(async (isoCode: string): Promise<Region[]> => {
    try {
      setLoading(true);
      const res = await fetch(`/api/geo/regions?country=${isoCode}&with_cities=true`);
      const data = await res.json();
      const regions = data.regions || [];
      setRegions(regions);
      return regions;
    } catch (err) {
      console.error("Failed to fetch regions:", err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const searchCities = useCallback(async (query: string): Promise<City[]> => {
    if (query.length < 2) {
      setSearchResults([]);
      return [];
    }

    try {
      setLoading(true);
      const countryParam = selectedCountry ? `&country=${selectedCountry.iso_code}` : 
                          countryCode ? `&country=${countryCode}` : "";
      const res = await fetch(`/api/geo/cities/search?q=${encodeURIComponent(query)}${countryParam}`);
      const data = await res.json();
      const cities = data.cities || [];
      setSearchResults(cities);
      return cities;
    } catch (err) {
      console.error("Failed to search cities:", err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [selectedCountry, countryCode]);

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleSearchChange = (query: string) => {
    setSearch(query);
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      searchCities(query);
    }, 200);
  };

  const handleCitySelect = (city: City) => {
    onChange({
      city,
      cityName: city.name,
      regionName: city.region?.name,
      countryCode: city.country?.iso_code,
      countryName: city.country?.name,
      latitude: city.latitude,
      longitude: city.longitude,
    });
    setOpen(false);
    setSearch("");
    setSearchResults([]);
  };

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    setView("regions");
    fetchRegions(country.iso_code);
  };

  const handleRegionSelect = (region: Region) => {
    setSelectedRegion(region);
    if (region.cities && region.cities.length > 0) {
      setCities(region.cities);
      setView("cities");
    }
  };

  const handleClear = () => {
    onChange(null);
    setSelectedCountry(null);
    setSelectedRegion(null);
    setSearch("");
    setSearchResults([]);
  };

  const handleBack = () => {
    if (view === "cities") {
      setView("regions");
      setSelectedRegion(null);
    } else if (view === "regions") {
      setView("countries");
      setSelectedCountry(null);
    } else {
      setView("search");
    }
  };

  // ============================================================================
  // Render
  // ============================================================================

  const displayValue = value?.cityName 
    ? `${value.cityName}${value.regionName ? `, ${value.regionName}` : ""}`
    : placeholder;

  const hasValue = !!value?.cityName;

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => {
          setOpen(!open);
          if (!open) {
            setView("search");
            if (countries.length === 0) fetchCountries();
          }
        }}
        className={`w-full flex items-center gap-2 px-3 py-2.5 bg-white dark:bg-gray-800 border rounded-lg transition-all text-left ${
          open
            ? "border-red-500 ring-2 ring-red-500/20"
            : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
        }`}
      >
        <MapPin size={18} className={hasValue ? "text-red-500" : "text-gray-400"} />
        <span className={`flex-1 truncate text-sm ${hasValue ? "text-gray-900 dark:text-white" : "text-gray-500"}`}>
          {displayValue}
        </span>
        {hasValue ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleClear();
            }}
            className="p-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <X size={14} className="text-gray-400" />
          </button>
        ) : (
          <ChevronDown size={16} className={`text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
          {/* Search View */}
          {view === "search" && (
            <>
              {/* Search Input */}
              <div className="p-3 border-b border-gray-100 dark:border-gray-800">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={search}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder={`Search in ${selectedCountry?.name || countryCode || "all countries"}...`}
                    className="w-full pl-9 pr-8 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-red-500 text-gray-900 dark:text-white placeholder-gray-400"
                  />
                  {loading && (
                    <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />
                  )}
                </div>
              </div>

              {/* Browse Option */}
              {showCountrySelector && (
                <button
                  type="button"
                  onClick={() => setView("countries")}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-100 dark:border-gray-800 transition-colors"
                >
                  <Globe size={18} className="text-gray-400" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Browse by country & region
                  </span>
                  <ChevronDown size={16} className="text-gray-400 ml-auto -rotate-90" />
                </button>
              )}

              {/* Search Results */}
              <div className="max-h-[300px] overflow-y-auto">
                {search.length >= 2 && !loading && searchResults.length === 0 && (
                  <div className="px-4 py-8 text-center">
                    <MapPin size={24} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-sm text-gray-500">No cities found for "{search}"</p>
                  </div>
                )}

                {searchResults.map((city, i) => (
                  <button
                    key={`${city.geoname_id}-${i}`}
                    type="button"
                    onClick={() => handleCitySelect(city)}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                  >
                    <div className="flex-shrink-0">
                      {city.is_capital ? (
                        <Star size={16} className="text-yellow-500" />
                      ) : city.is_major_city ? (
                        <Building2 size={16} className="text-blue-500" />
                      ) : (
                        <MapPin size={16} className="text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {city.name}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {[city.region?.name, city.country?.name].filter(Boolean).join(", ")}
                      </div>
                    </div>
                    {city.population > 0 && (
                      <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                        {formatPopulation(city.population)}
                      </span>
                    )}
                  </button>
                ))}

                {search.length < 2 && !loading && (
                  <div className="px-4 py-8 text-center">
                    <Search size={24} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-sm text-gray-500">Type to search for a city</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Countries View */}
          {view === "countries" && (
            <>
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleBack}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                >
                  <ChevronLeft size={18} className="text-gray-500" />
                </button>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Select Country
                </span>
              </div>

              <div className="max-h-[320px] overflow-y-auto">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 size={24} className="text-gray-400 animate-spin" />
                  </div>
                ) : (
                  countries.map((country) => (
                    <button
                      key={country.iso_code}
                      type="button"
                      onClick={() => handleCountrySelect(country)}
                      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                    >
                      <span className={`fi fi-${country.iso_code.toLowerCase()} fis`} style={{ width: 20, height: 20, borderRadius: 2 }} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {country.name}
                        </div>
                        {country.name_local && country.name_local !== country.name && (
                          <div className="text-xs text-gray-500">{country.name_local}</div>
                        )}
                      </div>
                      {country.listing_count ? (
                        <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                          {country.listing_count}
                        </span>
                      ) : null}
                      <ChevronDown size={16} className="text-gray-400 -rotate-90" />
                    </button>
                  ))
                )}
              </div>
            </>
          )}

          {/* Regions View */}
          {view === "regions" && selectedCountry && (
            <>
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleBack}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                >
                  <ChevronLeft size={18} className="text-gray-500" />
                </button>
                <span className={`fi fi-${selectedCountry.iso_code.toLowerCase()} fis`} style={{ width: 18, height: 18, borderRadius: 2 }} />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {selectedCountry.name}
                </span>
              </div>

              <div className="max-h-[320px] overflow-y-auto">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 size={24} className="text-gray-400 animate-spin" />
                  </div>
                ) : regions.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <Building2 size={24} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-sm text-gray-500">No regions available</p>
                  </div>
                ) : (
                  regions.map((region) => (
                    <button
                      key={region.id}
                      type="button"
                      onClick={() => handleRegionSelect(region)}
                      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                    >
                      <Building2 size={16} className="text-gray-400" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {region.name}
                        </div>
                        {region.cities && region.cities.length > 0 && (
                          <div className="text-xs text-gray-500">
                            {region.cities.slice(0, 3).map(c => c.name).join(", ")}
                            {region.cities.length > 3 && ` +${region.cities.length - 3} more`}
                          </div>
                        )}
                      </div>
                      {region.cities && region.cities.length > 0 && (
                        <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                          {region.cities.length}
                        </span>
                      )}
                      <ChevronDown size={16} className="text-gray-400 -rotate-90" />
                    </button>
                  ))
                )}
              </div>
            </>
          )}

          {/* Cities View */}
          {view === "cities" && selectedCountry && selectedRegion && (
            <>
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleBack}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                >
                  <ChevronLeft size={18} className="text-gray-500" />
                </button>
                <Building2 size={16} className="text-gray-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {selectedRegion.name}
                </span>
              </div>

              <div className="max-h-[320px] overflow-y-auto">
                {cities.map((city, i) => (
                  <button
                    key={`${city.id}-${i}`}
                    type="button"
                    onClick={() => handleCitySelect(city)}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                  >
                    <MapPin size={16} className="text-gray-400" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {city.name}
                      </div>
                    </div>
                    {city.population > 0 && (
                      <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                        {formatPopulation(city.population)}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Helpers
// ============================================================================

function formatPopulation(pop: number): string {
  if (pop >= 1000000) {
    return `${(pop / 1000000).toFixed(1)}M`;
  }
  if (pop >= 1000) {
    return `${Math.round(pop / 1000)}K`;
  }
  return pop.toString();
}
