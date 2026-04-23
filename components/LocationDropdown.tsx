"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { MapPin, Search, ChevronDown, X, Globe, Building2 } from "lucide-react";

interface LocationData {
  cities: { name: string; count: number; region?: string }[];
  regions: { name: string; count: number; cities: string[] }[];
  totalListings: number;
}

interface Props {
  countryCode: string;
  countryName: string;
  countryFlag?: string;
  selectedCity?: string;
  selectedRegion?: string;
  onChange: (location: { city?: string; region?: string } | null) => void;
  className?: string;
}

export default function LocationDropdown({
  countryCode,
  countryName,
  countryFlag,
  selectedCity,
  selectedRegion,
  onChange,
  className = "",
}: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [data, setData] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<"cities" | "regions">("cities");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Fetch location data when opened
  useEffect(() => {
    if (!open || data) return;

    setLoading(true);
    fetch(`/api/locations?country=${countryCode}`)
      .then(r => r.json())
      .then(d => {
        // Combine all cities from regions
        const allCities = d.regions?.flatMap((r: any) => 
          r.cities.map((c: any) => ({ ...c, region: r.name }))
        ) || [];
        
        setData({
          cities: [...(d.topCities || []), ...allCities].filter((c, i, arr) => 
            arr.findIndex(x => x.name === c.name) === i
          ),
          regions: d.regions || [],
          totalListings: d.totalListings || 0,
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [open, countryCode, data]);

  // Focus search when opened
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Filter based on search
  const filteredCities = useMemo(() => {
    if (!data) return [];
    if (!search) return data.cities.slice(0, 30);
    
    const q = search.toLowerCase();
    return data.cities
      .filter(c => 
        c.name.toLowerCase().includes(q) || 
        c.region?.toLowerCase().includes(q)
      )
      .slice(0, 20);
  }, [data, search]);

  const filteredRegions = useMemo(() => {
    if (!data) return [];
    if (!search) return data.regions;
    
    const q = search.toLowerCase();
    return data.regions.filter(r => 
      r.name.toLowerCase().includes(q) ||
      r.cities.some((c: any) => c.name?.toLowerCase().includes(q))
    );
  }, [data, search]);

  // Display text
  const displayText = selectedCity || selectedRegion || `All ${countryName}`;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 dark:hover:border-gray-600 transition-colors text-sm w-full"
      >
        {countryFlag && <span className="text-base">{countryFlag}</span>}
        <span className="text-gray-700 dark:text-gray-300 truncate flex-1 text-left">
          {displayText}
        </span>
        <ChevronDown 
          size={16} 
          className={`text-gray-400 transition-transform flex-shrink-0 ${open ? "rotate-180" : ""}`} 
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden min-w-[300px]">
          {/* Search */}
          <div className="p-3 border-b border-gray-100 dark:border-gray-800">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search city or region..."
                className="w-full pl-9 pr-8 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-red-500 text-gray-900 dark:text-white placeholder-gray-400"
              />
              {search && (
                <button
                  type="button"
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
              type="button"
              onClick={() => setView("cities")}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                view === "cities"
                  ? "text-red-600 border-b-2 border-red-600 -mb-px"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
              }`}
            >
              <MapPin size={14} className="inline mr-1.5" />
              Cities
            </button>
            <button
              type="button"
              onClick={() => setView("regions")}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                view === "regions"
                  ? "text-red-600 border-b-2 border-red-600 -mb-px"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
              }`}
            >
              <Building2 size={14} className="inline mr-1.5" />
              Regions
            </button>
          </div>

          {/* All Country option */}
          <button
            type="button"
            onClick={() => {
              onChange(null);
              setOpen(false);
              setSearch("");
            }}
            className={`w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-b border-gray-100 dark:border-gray-800 ${
              !selectedCity && !selectedRegion ? "bg-red-50 dark:bg-red-900/20" : ""
            }`}
          >
            <Globe size={18} className="text-gray-400 flex-shrink-0" />
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                All {countryName}
              </div>
              {data && (
                <div className="text-xs text-gray-500">
                  {data.totalListings} profiles
                </div>
              )}
            </div>
          </button>

          {/* Content */}
          <div className="max-h-[280px] overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-gray-200 border-t-red-600 rounded-full animate-spin" />
              </div>
            ) : view === "cities" ? (
              <>
                {filteredCities.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-gray-500">
                    {search ? `No cities found for "${search}"` : "No cities with profiles yet"}
                  </div>
                ) : (
                  filteredCities.map((city, i) => (
                    <button
                      key={`${city.name}-${i}`}
                      type="button"
                      onClick={() => {
                        onChange({ city: city.name, region: city.region });
                        setOpen(false);
                        setSearch("");
                      }}
                      className={`w-full px-4 py-2.5 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                        selectedCity === city.name ? "bg-red-50 dark:bg-red-900/20" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <MapPin size={14} className="text-gray-400 flex-shrink-0" />
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {city.name}
                          </div>
                          {city.region && (
                            <div className="text-xs text-gray-500 truncate">
                              {city.region}
                            </div>
                          )}
                        </div>
                      </div>
                      {city.count > 0 && (
                        <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full flex-shrink-0">
                          {city.count}
                        </span>
                      )}
                    </button>
                  ))
                )}
              </>
            ) : (
              <>
                {filteredRegions.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-gray-500">
                    {search ? `No regions found for "${search}"` : "No regions with profiles yet"}
                  </div>
                ) : (
                  filteredRegions.map((region, i) => (
                    <button
                      key={`${region.name}-${i}`}
                      type="button"
                      onClick={() => {
                        onChange({ region: region.name });
                        setOpen(false);
                        setSearch("");
                      }}
                      className={`w-full px-4 py-2.5 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                        selectedRegion === region.name ? "bg-red-50 dark:bg-red-900/20" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Building2 size={14} className="text-gray-400 flex-shrink-0" />
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {region.name}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {region.cities.length} cities
                          </div>
                        </div>
                      </div>
                      {region.count > 0 && (
                        <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full flex-shrink-0">
                          {region.count}
                        </span>
                      )}
                    </button>
                  ))
                )}
              </>
            )}
          </div>

          {/* Footer hint */}
          <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
            <p className="text-xs text-gray-500 text-center">
              Only showing locations with active profiles
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
