"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { MapPin, Loader2 } from "lucide-react"

interface LocationData {
  city: string
  region: string
  country: string
  countryCode: string
  postalCode?: string
  latitude: number
  longitude: number
  placeId: string
  formattedAddress: string
  majorCity?: string // Will be same as city for major cities, or nearest major city for small towns
}

interface Props {
  value?: string
  onChange: (location: LocationData | null) => void
  placeholder?: string
  className?: string
  countryRestrict?: string // ISO country code to restrict results
}

declare global {
  interface Window {
    google?: {
      maps: {
        places: {
          Autocomplete: new (
            input: HTMLInputElement,
            options?: google.maps.places.AutocompleteOptions
          ) => google.maps.places.Autocomplete
        }
      }
    }
    initGooglePlaces?: () => void
  }
}

export default function LocationAutocomplete({ 
  value, 
  onChange, 
  placeholder = "Search city or address...",
  className = "",
  countryRestrict
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
  const [inputValue, setInputValue] = useState(value || "")
  const [loading, setLoading] = useState(false)
  const [scriptLoaded, setScriptLoaded] = useState(false)

  // Load Google Places script
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY
    
    if (!apiKey) {
      console.warn("Google Places API key not configured")
      return
    }

    if (window.google?.maps?.places) {
      setScriptLoaded(true)
      return
    }

    // Check if script is already loading
    if (document.querySelector('script[src*="maps.googleapis.com"]')) {
      const checkLoaded = setInterval(() => {
        if (window.google?.maps?.places) {
          setScriptLoaded(true)
          clearInterval(checkLoaded)
        }
      }, 100)
      return () => clearInterval(checkLoaded)
    }

    const script = document.createElement("script")
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
    script.async = true
    script.defer = true
    script.onload = () => setScriptLoaded(true)
    document.head.appendChild(script)
  }, [])

  // Initialize autocomplete
  useEffect(() => {
    if (!scriptLoaded || !inputRef.current || !window.google?.maps?.places) return

    const options: google.maps.places.AutocompleteOptions = {
      types: ["(cities)"], // Restrict to cities
      fields: ["address_components", "geometry", "place_id", "formatted_address", "name"],
    }

    if (countryRestrict) {
      options.componentRestrictions = { country: countryRestrict }
    }

    autocompleteRef.current = new window.google.maps.places.Autocomplete(
      inputRef.current,
      options
    )

    autocompleteRef.current.addListener("place_changed", () => {
      const place = autocompleteRef.current?.getPlace()
      
      if (!place?.geometry?.location || !place.address_components) {
        onChange(null)
        return
      }

      // Extract components
      let city = ""
      let region = ""
      let country = ""
      let countryCode = ""
      let postalCode = ""

      for (const component of place.address_components) {
        const types = component.types

        if (types.includes("locality")) {
          city = component.long_name
        } else if (types.includes("administrative_area_level_2") && !city) {
          city = component.long_name
        } else if (types.includes("administrative_area_level_1")) {
          region = component.long_name
        } else if (types.includes("country")) {
          country = component.long_name
          countryCode = component.short_name
        } else if (types.includes("postal_code")) {
          postalCode = component.long_name
        }
      }

      // Use place name as city if not found
      if (!city && place.name) {
        city = place.name
      }

      const locationData: LocationData = {
        city,
        region,
        country,
        countryCode,
        postalCode: postalCode || undefined,
        latitude: place.geometry.location.lat(),
        longitude: place.geometry.location.lng(),
        placeId: place.place_id || "",
        formattedAddress: place.formatted_address || "",
        majorCity: city, // For now, same as city - can be enhanced with nearby search
      }

      setInputValue(place.formatted_address || city)
      onChange(locationData)
    })

    return () => {
      // Cleanup
      if (autocompleteRef.current) {
        window.google?.maps?.event?.clearInstanceListeners(autocompleteRef.current)
      }
    }
  }, [scriptLoaded, countryRestrict, onChange])

  // Fallback for when Google Places is not available
  const handleManualInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
    if (!scriptLoaded) {
      // If Google Places isn't available, just pass the text
      onChange(null)
    }
  }, [scriptLoaded, onChange])

  return (
    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <MapPin className="w-4 h-4" />
        )}
      </div>
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleManualInput}
        placeholder={placeholder}
        className={`w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 ${className}`}
        autoComplete="off"
      />
      {!process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY && (
        <p className="text-xs text-amber-600 mt-1">
          Location autocomplete unavailable
        </p>
      )}
    </div>
  )
}
