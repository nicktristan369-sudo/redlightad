"use client"

import { useState } from "react"

interface Props {
  latitude: number | null | undefined
  longitude: number | null | undefined
  profileImage: string | null | undefined
}

export default function MapMeSection({ latitude, longitude, profileImage }: Props) {
  const [imgError, setImgError] = useState(false)
  const [profileImgError, setProfileImgError] = useState(false)

  // CRITICAL: Full null/undefined checks — return null if ANY data missing
  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return null
  }

  // Additional safety: check for valid coordinate ranges
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return null
  }

  // Build static map URL
  let mapUrl: string
  try {
    mapUrl = `/api/geo/static-map?lat=${latitude}&lng=${longitude}&zoom=14&width=600&height=200`
  } catch {
    return null
  }

  const handleOpenMaps = () => {
    try {
      window.open(`https://www.google.com/maps?q=${latitude},${longitude}`, "_blank")
    } catch {
      // Ignore errors
    }
  }

  // Fallback if map image fails - show just the button
  if (imgError) {
    return (
      <div style={{
        background: "#fff",
        border: "1px solid #E5E7EB",
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 14,
        }}>
          <span style={{ fontSize: 16 }}>📍</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: "#111" }}>Map me</span>
        </div>
        <button
          onClick={handleOpenMaps}
          style={{
            width: "100%",
            padding: "12px 20px",
            background: "#DC2626",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 600,
            color: "#fff",
          }}
        >
          Open in Google Maps
        </button>
      </div>
    )
  }

  return (
    <div style={{
      background: "#fff",
      border: "1px solid #E5E7EB",
      borderRadius: 12,
      overflow: "hidden",
      marginBottom: 16,
    }}>
      {/* Header */}
      <div style={{
        padding: "12px 16px",
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}>
        <span style={{ fontSize: 16 }}>📍</span>
        <span style={{ fontSize: 14, fontWeight: 600, color: "#111" }}>Map me</span>
      </div>

      {/* Map with profile image overlay */}
      <div style={{
        position: "relative",
        height: 160,
        overflow: "hidden",
      }}>
        {/* Map image */}
        <img
          src={mapUrl}
          alt="Location"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
          onError={() => setImgError(true)}
        />

        {/* Profile image circle - floating on map */}
        {profileImage && !profileImgError && (
          <div style={{
            position: "absolute",
            bottom: 20,
            right: 24,
            width: 56,
            height: 56,
            borderRadius: "50%",
            border: "3px solid #fff",
            overflow: "hidden",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          }}>
            <img
              src={profileImage}
              alt=""
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
              onError={() => setProfileImgError(true)}
            />
          </div>
        )}
      </div>

      {/* Button */}
      <div style={{ padding: "12px 16px" }}>
        <button
          onClick={handleOpenMaps}
          style={{
            width: "100%",
            padding: "12px 20px",
            background: "#DC2626",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 600,
            color: "#fff",
          }}
        >
          Open in Google Maps
        </button>
      </div>
    </div>
  )
}
