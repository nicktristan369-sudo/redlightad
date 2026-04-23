"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { MapPin, Search, X, Loader2 } from "lucide-react";

interface City {
  name: string;
  region: string;
  country: string;
  countryCode: string;
}

interface Props {
  value: string;
  country: string; // Country code like "DE", "US", etc.
  onChange: (city: string, region?: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

// This fetches cities from our database + external geocoding if needed
export default function CityAutocomplete({
  value,
  country,
  onChange,
  placeholder = "Enter city name...",
  required = false,
  className = "",
}: Props) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<City[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Sync external value changes
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Fetch suggestions
  const fetchSuggestions = async (q: string) => {
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `/api/cities/autocomplete?q=${encodeURIComponent(q)}&country=${country}`
      );
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data.cities || []);
      }
    } catch (err) {
      console.error("City autocomplete error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search
  const handleInputChange = (newQuery: string) => {
    setQuery(newQuery);
    setSelectedIndex(-1);
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(newQuery);
    }, 200);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || suggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          selectCity(suggestions[selectedIndex]);
        }
        break;
      case "Escape":
        setShowDropdown(false);
        break;
    }
  };

  const selectCity = (city: City) => {
    setQuery(city.name);
    onChange(city.name, city.region);
    setShowDropdown(false);
    setSuggestions([]);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <MapPin
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => handleInputChange(e.target.value)}
          onFocus={() => {
            setShowDropdown(true);
            if (query.length >= 2) fetchSuggestions(query);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          required={required}
          className="w-full pl-10 pr-10 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-red-500 dark:focus:border-red-500 text-gray-900 dark:text-white placeholder-gray-400"
        />
        {loading && (
          <Loader2
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin"
          />
        )}
        {!loading && query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              onChange("");
              setSuggestions([]);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <X size={14} className="text-gray-400" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 max-h-[240px] overflow-y-auto"
        >
          {suggestions.map((city, i) => (
            <button
              key={`${city.name}-${city.region}-${i}`}
              type="button"
              onClick={() => selectCity(city)}
              className={`w-full px-4 py-2.5 text-left flex items-center gap-3 transition-colors ${
                i === selectedIndex
                  ? "bg-red-50 dark:bg-red-900/20"
                  : "hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              <MapPin size={14} className="text-gray-400 flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {city.name}
                </div>
                {city.region && (
                  <div className="text-xs text-gray-500 truncate">
                    {city.region}, {city.country}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results */}
      {showDropdown && query.length >= 2 && !loading && suggestions.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 p-4 text-center">
          <p className="text-sm text-gray-500">
            No cities found. Type to search.
          </p>
        </div>
      )}
    </div>
  );
}
