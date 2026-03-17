"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";

interface PhotoGalleryProps {
  images: string[];
  totalPhotos: number;
  name: string;
}

export default function PhotoGallery({ images, totalPhotos, name }: PhotoGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => setLightboxOpen(false);

  const prev = useCallback(() => {
    setLightboxIndex((i) => (i === 0 ? images.length - 1 : i - 1));
  }, [images.length]);

  const next = useCallback(() => {
    setLightboxIndex((i) => (i === images.length - 1 ? 0 : i + 1));
  }, [images.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!lightboxOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightboxOpen, prev, next]);

  // Lock body scroll when lightbox is open
  useEffect(() => {
    if (lightboxOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [lightboxOpen]);

  return (
    <>
      {/* ── Main image (click to open lightbox) ── */}
      <div className="relative aspect-video overflow-hidden rounded-xl group cursor-zoom-in"
        onClick={() => openLightbox(activeIndex)}>
        <Image
          src={images[activeIndex]}
          alt={`${name} photo ${activeIndex + 1}`}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          unoptimized
        />
        {/* Counter badge */}
        <span className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 text-sm font-medium text-gray-700 shadow">
          {activeIndex + 1} / {totalPhotos} Photos
        </span>
        {/* Zoom hint */}
        <span className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-[12px] font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity">
          <ZoomIn size={13} />
          View fullscreen
        </span>
      </div>

      {/* ── Thumbnails ── */}
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

      {/* ── Lightbox ── */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.93)" }}
          onClick={closeLightbox}
        >
          {/* Image container — stop propagation so clicking image doesn't close */}
          <div
            className="relative flex items-center justify-center"
            style={{ maxWidth: "92vw", maxHeight: "92vh", width: "100%", height: "100%" }}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={images[lightboxIndex]}
              alt={`${name} photo ${lightboxIndex + 1}`}
              style={{
                maxWidth: "92vw",
                maxHeight: "92vh",
                objectFit: "contain",
                borderRadius: "8px",
                userSelect: "none",
                WebkitUserSelect: "none",
                pointerEvents: "none",
              }}
              draggable={false}
            />

            {/* ── Watermark — only in lightbox ── */}
            <div
              style={{
                position: "absolute",
                bottom: "18px",
                right: "18px",
                pointerEvents: "none",
                userSelect: "none",
                WebkitUserSelect: "none",
              }}
            >
              <span
                style={{
                  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
                  fontSize: "13px",
                  fontWeight: 600,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.60)",
                  textShadow: "0 1px 3px rgba(0,0,0,0.8), 0 0 6px rgba(0,0,0,0.6)",
                }}
              >
                REDLIGHTAD.COM
              </span>
            </div>

            {/* Counter */}
            <div
              className="absolute top-3 left-3 rounded-full px-3 py-1 text-[13px] font-medium text-white"
              style={{ background: "rgba(0,0,0,0.55)" }}
            >
              {lightboxIndex + 1} / {images.length}
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 flex items-center justify-center rounded-full transition-colors"
            style={{ width: 40, height: 40, background: "rgba(255,255,255,0.12)" }}
          >
            <X size={20} color="#fff" />
          </button>

          {/* Prev / Next — only if multiple images */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prev(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center rounded-full transition-colors"
                style={{ width: 44, height: 44, background: "rgba(255,255,255,0.12)" }}
              >
                <ChevronLeft size={22} color="#fff" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); next(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center rounded-full transition-colors"
                style={{ width: 44, height: 44, background: "rgba(255,255,255,0.12)" }}
              >
                <ChevronRight size={22} color="#fff" />
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
}
