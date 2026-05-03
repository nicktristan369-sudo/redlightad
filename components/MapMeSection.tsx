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

  // CRITICAL: Full null/undefined checks
  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return null
  }
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return null
  }

  const mapUrl = `/api/geo/static-map?lat=${latitude}&lng=${longitude}&zoom=15&width=800&height=300`

  const handleClick = () => {
    try {
      window.open(`https://www.google.com/maps?q=${latitude},${longitude}`, "_blank")
    } catch {}
  }

  if (imgError) {
    return null
  }

  return (
    <div style={{
      background: "#fff",
      borderRadius: 16,
      overflow: "hidden",
      marginBottom: 16,
      boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
    }}>
      {/* Header */}
      <div style={{
        padding: "14px 18px",
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}>
        {/* Location pin icon */}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#DC2626"/>
          <circle cx="12" cy="9" r="2.5" fill="#fff"/>
        </svg>
        <span style={{ fontSize: 15, fontWeight: 600, color: "#111" }}>Map me</span>
      </div>

      {/* Map with profile image overlay */}
      <div
        onClick={handleClick}
        style={{
          position: "relative",
          height: 180,
          cursor: "pointer",
        }}
      >
        <img
          src={mapUrl}
          alt="Location map"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
          onError={() => setImgError(true)}
        />

        {/* Profile image circle with blue border - centered on map */}
        {profileImage && !profileImgError && (
          <div style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 52,
            height: 52,
            borderRadius: "50%",
            border: "3px solid #3B82F6",
            background: "#fff",
            overflow: "hidden",
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
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
    </div>
  )
}
