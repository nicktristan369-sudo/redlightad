"use client";

import { MapPin } from "lucide-react";

interface Props {
  latitude: number;
  longitude: number;
  profileImage: string | null;
}

export default function MapMeSection({ latitude, longitude, profileImage }: Props) {
  const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
  const staticMapUrl = `/api/geo/static-map?lat=${latitude}&lng=${longitude}&zoom=15&size=600x250`;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <MapPin size={18} className="text-red-500" />
        <h3 className="text-[15px] font-semibold text-gray-900">Map me</h3>
      </div>

      {/* Map with profile pin overlay */}
      <a
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block relative group cursor-pointer"
      >
        {/* Static map */}
        <img
          src={staticMapUrl}
          alt="Location map"
          className="w-full h-[200px] object-cover rounded-xl transition-all group-hover:shadow-lg group-hover:opacity-95"
        />

        {/* Profile image pin overlay - centered on map */}
        <div
          className="absolute"
          style={{
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -100%)", // Position so bottom of circle is at center
          }}
        >
          {/* Pin stem */}
          <div
            className="absolute left-1/2 -translate-x-1/2 bottom-0 w-0 h-0"
            style={{
              borderLeft: "8px solid transparent",
              borderRight: "8px solid transparent",
              borderTop: "12px solid white",
            }}
          />
          {/* Profile circle */}
          <div
            className="w-10 h-10 rounded-full border-[3px] border-white shadow-lg overflow-hidden bg-gray-200"
            style={{ marginBottom: "8px" }}
          >
            {profileImage ? (
              <img
                src={profileImage}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center">
                <MapPin size={16} className="text-white" />
              </div>
            )}
          </div>
        </div>

        {/* Hover hint */}
        <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-lg text-[11px] font-medium text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
          Open in Google Maps →
        </div>
      </a>
    </div>
  );
}
