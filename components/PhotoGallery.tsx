"use client";

import { useState } from "react";
import Image from "next/image";

interface PhotoGalleryProps {
  images: string[];
  totalPhotos: number;
  name: string;
}

export default function PhotoGallery({ images, totalPhotos, name }: PhotoGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div>
      {/* Main image */}
      <div className="relative aspect-video overflow-hidden rounded-xl">
        <Image
          src={images[activeIndex]}
          alt={`${name} photo ${activeIndex + 1}`}
          fill
          className="object-cover"
          unoptimized
        />
        <span className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 text-sm font-medium text-gray-700 shadow">
          {activeIndex + 1} / {totalPhotos} Photos
        </span>
      </div>

      {/* Thumbnails */}
      <div className="mt-3 flex gap-2 overflow-x-auto">
        {images.map((img, i) => (
          <button
            key={i}
            onClick={() => setActiveIndex(i)}
            className={`relative h-[60px] w-[60px] flex-shrink-0 overflow-hidden rounded-md ${
              i === activeIndex ? "ring-2 ring-red-600" : "ring-1 ring-gray-200"
            }`}
          >
            <Image
              src={img}
              alt={`${name} thumbnail ${i + 1}`}
              fill
              className="object-cover"
              unoptimized
            />
          </button>
        ))}
      </div>
    </div>
  );
}
