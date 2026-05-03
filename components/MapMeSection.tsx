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

  // Build static map URL (no marker - we overlay our own)
  let mapUrl: string
  try {
    mapUrl = `/api/geo/static-map?lat=${latitude}&lng=${longitude}&zoom=14&size=600x280&style=minimal`
  } catch {
    return null
  }

  const handleMapClick = () => {
    try {
      window.open(`https://www.google.com/maps?q=${latitude},${longitude}`, "_blank")
    } catch {
      // Ignore click errors
    }
  }

  // Fallback if map image fails
  if (imgError) {
    return (
      <div style={{
        background: "#fff",
        border: "1px solid #E5E7EB",
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
      }}>
        <div style={{
          fontSize: 15,
          fontWeight: 700,
          color: "#111",
          marginBottom: 16,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}>
          <span style={{ fontSize: 18 }}>📍</span>
          Map me
        </div>
        <button
          onClick={handleMapClick}
          style={{
            width: "100%",
            padding: "14px 20px",
            background: "#DC2626",
            border: "none",
            borderRadius: 12,
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 600,
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
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
      borderRadius: 16,
      overflow: "hidden",
      marginBottom: 16,
      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    }}>
      {/* Header */}
      <div style={{
        padding: "14px 18px",
        borderBottom: "1px solid #F3F4F6",
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}>
        <span style={{ fontSize: 18 }}>📍</span>
        <span style={{ fontSize: 15, fontWeight: 700, color: "#111" }}>Map me</span>
      </div>

      {/* Map with custom marker overlay */}
      <div
        onClick={handleMapClick}
        style={{
          position: "relative",
          cursor: "pointer",
          height: 220,
          overflow: "hidden",
        }}
      >
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

        {/* Custom pin with profile image */}
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -100%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.25))",
        }}>
          {/* Pin body */}
          <div style={{
            width: 52,
            height: 52,
            borderRadius: "50% 50% 50% 0",
            background: "#DC2626",
            transform: "rotate(-45deg)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "3px solid #fff",
          }}>
            {/* Profile image inside pin */}
            <div style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              overflow: "hidden",
              transform: "rotate(45deg)",
              background: "#fff",
            }}>
              {profileImage && !profileImgError ? (
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
              ) : (
                <div style={{
                  width: "100%",
                  height: "100%",
                  background: "linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontSize: 18,
                  fontWeight: 700,
                }}>
                  ♥
                </div>
              )}
            </div>
          </div>
          {/* Pin point */}
          <div style={{
            width: 0,
            height: 0,
            borderLeft: "8px solid transparent",
            borderRight: "8px solid transparent",
            borderTop: "12px solid #DC2626",
            marginTop: -3,
          }} />
        </div>

        {/* Tap hint */}
        <div style={{
          position: "absolute",
          bottom: 12,
          right: 12,
          background: "rgba(0,0,0,0.7)",
          backdropFilter: "blur(4px)",
          color: "#fff",
          fontSize: 12,
          fontWeight: 500,
          padding: "6px 12px",
          borderRadius: 20,
        }}>
          Tap for directions →
        </div>
      </div>
    </div>
  )
}
