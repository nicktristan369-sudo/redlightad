"use client";

import { useState } from "react";

/* ---------- TYPES ---------- */
interface AnnonceDetailClientProps {
  images: string[];
  totalPhotos: number;
  hasVoiceMessage: boolean;
}

/* ========== LOCKED PHOTO GALLERY ========== */
function LockedPhotoGallery({
  images,
  totalPhotos,
}: {
  images: string[];
  totalPhotos: number;
}) {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div>
      {/* Main image */}
      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[activeIndex]}
          alt={`Photo ${activeIndex + 1}`}
          className="w-full max-h-[500px] object-cover rounded-xl"
        />
        <span className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm text-gray-700 text-sm font-medium px-3 py-1.5 rounded-full shadow">
          {activeIndex + 1} / {totalPhotos} Photos
        </span>
      </div>

      {/* Thumbnails */}
      <div className="mt-3 flex gap-2">
        {images.map((img, i) => {
          const isLocked = i >= 3;
          return (
            <button
              key={i}
              onClick={() => !isLocked && setActiveIndex(i)}
              className={`relative w-[60px] h-[60px] rounded-md overflow-hidden flex-shrink-0 ${
                activeIndex === i ? "ring-2 ring-red-600" : ""
              } ${isLocked ? "cursor-not-allowed" : "cursor-pointer"}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img}
                alt={`Thumbnail ${i + 1}`}
                className={`w-full h-full object-cover ${isLocked ? "blur-[6px]" : ""}`}
              />
              {isLocked && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ========== VOICE MESSAGE PLAYER ========== */
function VoiceMessagePlayer() {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="rounded-xl bg-white p-5 shadow-md">
      <div className="mb-4 flex items-center gap-2">
        <span className="text-red-600 text-lg">🎙️</span>
        <h3 className="font-semibold text-gray-900">Stemmebesked</h3>
      </div>

      <div className="flex items-center gap-4">
        {/* Play / Pause button */}
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors cursor-pointer"
        >
          {isPlaying ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <rect x="5" y="4" width="3" height="12" rx="1" />
              <rect x="12" y="4" width="3" height="12" rx="1" />
            </svg>
          ) : (
            <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M6.5 4.5v11l9-5.5-9-5.5z" />
            </svg>
          )}
        </button>

        {/* Progress bar */}
        <div className="flex-1">
          <div className="h-2 w-full rounded-full bg-gray-200">
            <div className="h-2 rounded-full bg-red-600" style={{ width: "40%" }} />
          </div>
        </div>

        {/* Time */}
        <span className="text-sm text-gray-500 flex-shrink-0">1:02 / 2:34</span>
      </div>
    </div>
  );
}

/* ========== MAIN CLIENT COMPONENT ========== */
export default function AnnonceDetailClient({
  images,
  totalPhotos,
  hasVoiceMessage,
}: AnnonceDetailClientProps) {
  return (
    <>
      <LockedPhotoGallery images={images} totalPhotos={totalPhotos} />

      {/* Locked Banner */}
      <div className="mt-6 rounded-xl border border-red-100 bg-gradient-to-r from-red-50 to-pink-50 p-5 text-center">
        <div className="text-2xl mb-2">🔒</div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">
          Se alle private billeder og videoer
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Opret en gratis konto for at få adgang til alle {totalPhotos} billeder
          og eksklusive videoer
        </p>
        <button className="w-full rounded-xl bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-700 transition-colors cursor-pointer">
          Opret gratis konto
        </button>
      </div>

      {hasVoiceMessage && (
        <div className="mt-6">
          <VoiceMessagePlayer />
        </div>
      )}
    </>
  );
}
