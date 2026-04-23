"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { MapPin, Search, ChevronDown, X, Globe } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";

interface City {
  name: string;
  region?: string;
  count?: number;
}

interface Region {
  name: string;
  cities: City[];
}

interface LocationData {
  country: string;
  countryCode: string;
  regions: Region[];
  topCities: City[];
}

// This will be fetched from API based on active listings
const useLocationData = (countryCode: string) => {
  const [data, setData] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/locations?country=${countryCode}`)
      .then(r => r.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [countryCode]);

  return { data, loading };
};

interface Props {
  countryCode: string;
  countryName: string;
  onSelect: (location: { city?: string; region?: string } | null) => void;
  currentCity?: string;
  currentRegion?: string;
}

export default function SmartLocationPicker({
  countryCode,
  countryName,
  onSelect,
  currentCity,
  currentRegion,
}: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"cities" | "regions">("cities");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { data, loading } = useLocationData(countryCode);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  // Filter cities based on search
  const filteredCities = useMemo(() => {
    if (!data) return [];
    const allCities = data.regions.flatMap(r => 
      r.cities.map(c => ({ ...c, region: r.name }))
    );
    
    if (!search) {
      // Show top cities first, then others
      return [...data.topCities, ...allCities.filter(c => 
        !data.topCities.some(tc => tc.name === c.name)
      )].slice(0, 50);
    }
    
    const q = search.toLowerCase();
    return allCities
      .filter(c => c.name.toLowerCase().includes(q) || c.region?.toLowerCase().includes(q))
      .slice(0, 30);
  }, [data, search]);

  // Filter regions based on search
  const filteredRegions = useMemo(() => {
    if (!data) return [];
    if (!search) return data.regions;
    
    const q = search.toLowerCase();
    return data.regions.filter(r => 
      r.name.toLowerCase().includes(q) ||
      r.cities.some(c => c.name.toLowerCase().includes(q))
    );
  }, [data, search]);

  const displayValue = currentCity || currentRegion || `All ${countryName}`;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 dark:hover:border-gray-600 transition-colors min-w-[180px]"
      >
        <MapPin size={16} className="text-gray-500 dark:text-gray-400 flex-shrink-0" />
        <span className="text-sm text-gray-700 dark:text-gray-300 truncate flex-1 text-left">
          {displayValue}
        </span>
        <ChevronDown size={16} className={`text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 mt-2 w-[320px] max-h-[420px] bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden animate-dropdown">
          {/* Search Input */}
          <div className="p-3 border-b border-gray-100 dark:border-gray-800">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search city or region..."
                className="w-full pl-9 pr-8 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-red-500 dark:focus:border-red-500 text-gray-900 dark:text-white placeholder-gray-400"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                >
                  <X size={14} className="text-gray-400" />
                </button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-100 dark:border-gray-800">
            <button
              onClick={() => setActiveTab("cities")}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                activeTab === "cities"
                  ? "text-red-600 border-b-2 border-red-600"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
              }`}
            >
              Cities
            </button>
            <button
              onClick={() => setActiveTab("regions")}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                activeTab === "regions"
                  ? "text-red-600 border-b-2 border-red-600"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
              }`}
            >
              Regions
            </button>
          </div>

          {/* "All Country" option */}
          <button
            onClick={() => {
              onSelect(null);
              setOpen(false);
              setSearch("");
            }}
            className={`w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-b border-gray-100 dark:border-gray-800 ${
              !currentCity && !currentRegion ? "bg-red-50 dark:bg-red-900/20" : ""
            }`}
          >
            <Globe size={18} className="text-gray-400" />
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                All {countryName}
              </div>
              <div className="text-xs text-gray-500">Show all locations</div>
            </div>
          </button>

          {/* Content */}
          <div className="max-h-[280px] overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-gray-200 border-t-red-600 rounded-full animate-spin" />
              </div>
            ) : activeTab === "cities" ? (
              <div className="py-2">
                {filteredCities.length === 0 ? (
                  <div className="px-4 py-6 text-center text-sm text-gray-500">
                    No cities found
                  </div>
                ) : (
                  filteredCities.map((city, i) => (
                    <button
                      key={`${city.name}-${i}`}
                      onClick={() => {
                        onSelect({ city: city.name, region: city.region });
                        setOpen(false);
                        setSearch("");
                      }}
                      className={`w-full px-4 py-2.5 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                        currentCity === city.name ? "bg-red-50 dark:bg-red-900/20" : ""
                      }`}
                    >
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {city.name}
                        </div>
                        {city.region && (
                          <div className="text-xs text-gray-500">{city.region}</div>
                        )}
                      </div>
                      {city.count !== undefined && city.count > 0 && (
                        <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                          {city.count}
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>
            ) : (
              <div className="py-2">
                {filteredRegions.length === 0 ? (
                  <div className="px-4 py-6 text-center text-sm text-gray-500">
                    No regions found
                  </div>
                ) : (
                  filteredRegions.map((region, i) => (
                    <button
                      key={`${region.name}-${i}`}
                      onClick={() => {
                        onSelect({ region: region.name });
                        setOpen(false);
                        setSearch("");
                      }}
                      className={`w-full px-4 py-2.5 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                        currentRegion === region.name ? "bg-red-50 dark:bg-red-900/20" : ""
                      }`}
                    >
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {region.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {region.cities.length} cities
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
