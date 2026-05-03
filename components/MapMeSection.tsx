"use client"

import { useState } from "react"
import { MapPin } from "lucide-react"

interface Props {
  latitude: number | null | undefined
  longitude: number | null | undefined
  profileImage: string | null | undefined
}

export default function MapMeSection({ latitude, longitude, profileImage }: Props) {
  const [imgError, setImgError] = useState(false)

  // CRITICAL: Full null/undefined checks — return null if ANY data missing
  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return null
  }

  // Additional safety: check for valid coordinate ranges
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return null
  }

  // Build static map URL with fallback
  let mapUrl: string
  try {
    const params = new URLSearchParams({
      lat: String(latitude),
      lng: String(longitude),
      zoom: "14",
      width: "600",
      height: "300",
    })
    if (profileImage && typeof profileImage === "string" && profileImage.length > 0) {
      params.set("marker", profileImage)
    }
    mapUrl = `/api/geo/static-map?${params.toString()}`
  } catch {
    // If URL building fails, don't crash — just don't show map
    return null
  }

  const handleMapClick = () => {
    try {
      window.open(`https://www.google.com/maps?q=${latitude},${longitude}`, "_blank")
    } catch {
      // Ignore click errors
    }
  }

  // If image failed to load, show text fallback instead of broken image
  if (imgError) {
    return (
      <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <MapPin size={18} color="#DC2626" />
          <span style={{ fontSize: 14, fontWeight: 700, color: "#111" }}>📍 Map me</span>
        </div>
        <button
          onClick={handleMapClick}
          style={{
            width: "100%",
            padding: "12px 16px",
            background: "#F3F4F6",
            border: "1px solid #E5E7EB",
            borderRadius: 8,
            cursor: "pointer",
            fontSize: 13,
            color: "#374151",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
          }}
        >
          <MapPin size={14} />
          Open in Google Maps
        </button>
      </div>
    )
  }

  return (
    <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 12, padding: 16, marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <MapPin size={18} color="#DC2626" />
        <span style={{ fontSize: 14, fontWeight: 700, color: "#111" }}>📍 Map me</span>
      </div>
      <div
        onClick={handleMapClick}
        style={{ cursor: "pointer", borderRadius: 10, overflow: "hidden", position: "relative" }}
      >
        <img
          src={mapUrl}
          alt="Location map"
          style={{ width: "100%", height: "auto", display: "block", minHeight: 150 }}
          onError={() => setImgError(true)}
        />
        <div style={{
          position: "absolute",
          bottom: 8,
          right: 8,
          background: "rgba(0,0,0,0.6)",
          color: "#fff",
          fontSize: 11,
          padding: "4px 8px",
          borderRadius: 6,
        }}>
          Tap to open directions
        </div>
      </div>
    </div>
  )
}
