"use client";

import { useState } from "react";

export default function VoicePlayer() {
  const [playing, setPlaying] = useState(false);

  return (
    <div className="flex items-center gap-4 rounded-xl bg-white p-4 shadow-md">
      {/* Icon */}
      <span className="text-2xl text-red-600">🎙️</span>

      {/* Content */}
      <div className="flex-1">
        <p className="mb-2 text-sm font-semibold text-gray-900">Voice Message</p>
        {/* Progress bar */}
        <div className="h-1.5 w-full rounded-full bg-gray-200">
          <div className="h-1.5 w-[35%] rounded-full bg-red-600" />
        </div>
      </div>

      {/* Duration */}
      <span className="text-xs text-gray-500">0:23</span>

      {/* Play/Pause button */}
      <button
        onClick={() => setPlaying(!playing)}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600 text-white hover:bg-red-700"
      >
        {playing ? (
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="4" width="4" height="16" />
            <rect x="14" y="4" width="4" height="16" />
          </svg>
        ) : (
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>
    </div>
  );
}
