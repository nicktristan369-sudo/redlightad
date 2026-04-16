"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, Maximize2, Lock } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { highQualityUrl } from "@/lib/cloudinaryUrl";

interface PhotoGalleryProps {
  images: string[];
  totalPhotos: number;
  name: string;
  isLoggedIn?: boolean;
}

export default function PhotoGallery({
  images,
  totalPhotos,
  name,
  isLoggedIn = false,
}: PhotoGalleryProps) {
  const { t } = useLanguage();
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lockModalOpen, setLockModalOpen] = useState(false);
  const autoSlideRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const thumbStripRef = useRef<HTMLDivElement>(null);
  const galTouchStart = useRef<number | null>(null);
  const lbTouchStart = useRef<number | null>(null);

  const count = images.length;
  const prevIdx = (activeIndex - 1 + count) % count;
  const nextIdx = (activeIndex + 1) % count;

  const isLocked = (index: number) => !isLoggedIn && index > 0;

  // Auto-slide every 3s
  const startAutoSlide = useCallback(() => {
    if (autoSlideRef.current) clearInterval(autoSlideRef.current);
    if (count <= 1) return;
    autoSlideRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % count);
    }, 3000);
  }, [count]);

  const scheduleRestart = useCallback(() => {
    if (autoSlideRef.current) clearInterval(autoSlideRef.current);
    if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
    restartTimerRef.current = setTimeout(startAutoSlide, 5000);
  }, [startAutoSlide]);

  useEffect(() => {
    startAutoSlide();
    return () => {
      if (autoSlideRef.current) clearInterval(autoSlideRef.current);
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
    };
  }, [startAutoSlide]);

  const goTo = useCallback((index: number) => {
    if (isLocked(index)) {
      setLockModalOpen(true);
      return;
    }
    setActiveIndex(index);
    scheduleRestart();
    if (thumbStripRef.current) {
      const btn = thumbStripRef.current.children[index] as HTMLElement | undefined;
      btn?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }, [scheduleRestart, isLoggedIn]);

  const prevGal = () => {
    for (let i = 1; i <= count; i++) {
      const candidate = (activeIndex - i + count) % count;
      if (!isLocked(candidate)) { goTo(candidate); return; }
    }
  };
  const nextGal = () => {
    for (let i = 1; i <= count; i++) {
      const candidate = (activeIndex + i) % count;
      if (!isLocked(candidate)) { goTo(candidate); return; }
    }
  };

  const openLightbox = useCallback((index: number) => {
    if (isLocked(index)) {
      setLockModalOpen(true);
      return;
    }
    setLightboxIndex(index);
    setLightboxOpen(true);
    if (autoSlideRef.current) clearInterval(autoSlideRef.current);
  }, [isLoggedIn]);

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false);
    scheduleRestart();
  }, [scheduleRestart]);

  const lbPrev = useCallback(() =>
    setLightboxIndex((i) => (i - 1 + count) % count), [count]);
  const lbNext = useCallback(() =>
    setLightboxIndex((i) => (i + 1) % count), [count]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      else if (e.key === "ArrowLeft") lbPrev();
      else if (e.key === "ArrowRight") lbNext();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightboxOpen, closeLightbox, lbPrev, lbNext]);

  useEffect(() => {
    if (!lockModalOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setLockModalOpen(false); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lockModalOpen]);

  useEffect(() => {
    document.body.style.overflow = (lightboxOpen || lockModalOpen) ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [lightboxOpen, lockModalOpen]);

  const handleGalTouchStart = (e: React.TouchEvent) => { galTouchStart.current = e.touches[0].clientX; };
  const handleGalTouchEnd = (e: React.TouchEvent) => {
    if (galTouchStart.current === null) return;
    const diff = galTouchStart.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) { diff > 0 ? nextGal() : prevGal(); }
    galTouchStart.current = null;
  };

  const handleLbTouchStart = (e: React.TouchEvent) => { lbTouchStart.current = e.touches[0].clientX; };
  const handleLbTouchEnd = (e: React.TouchEvent) => {
    if (lbTouchStart.current === null) return;
    const diff = lbTouchStart.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) diff > 0 ? lbNext() : lbPrev();
    lbTouchStart.current = null;
  };

  if (count === 0) return null;

  return (
    <>
      {/* ════════════════════════════════════════════════════════
          GALLERY — TS4Rent Style
          ════════════════════════════════════════════════════════ */}
      <div className="overflow-hidden rounded-xl" style={{ background: "#1a1a1a" }}>

        {/* ── DESKTOP: 3-panel layout like ts4rent.de ─────────── */}
        <div className="hidden md:block">
          <div
            className="relative w-full"
            style={{ height: 520 }}
            onTouchStart={handleGalTouchStart}
            onTouchEnd={handleGalTouchEnd}
          >
            <div className="absolute inset-0 flex items-stretch">

              {/* Left preview — larger, 18% width */}
              {count > 1 && (
                <div
                  className="relative flex-shrink-0 cursor-pointer overflow-hidden"
                  style={{ width: "18%", background: "#111" }}
                  onClick={() => isLocked(prevIdx) ? setLockModalOpen(true) : prevGal()}
                >
                  <img 
                    src={highQualityUrl(images[prevIdx])} 
                    alt="" 
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    style={{ opacity: 0.6 }}
                    draggable={false} 
                  />
                  {isLocked(prevIdx) && (
                    <div className="absolute inset-0 flex items-center justify-center"
                      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}>
                      <Lock size={24} color="#fff" />
                    </div>
                  )}
                </div>
              )}

              {/* Center main image — fills remaining space */}
              <div
                className="relative flex-1 cursor-pointer group overflow-hidden"
                style={{ background: "#111" }}
                onClick={() => openLightbox(activeIndex)}
              >
                <img
                  src={highQualityUrl(images[activeIndex])}
                  alt={`${name} photo ${activeIndex + 1}`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                  draggable={false}
                />
                
                {/* Counter — top left */}
                <div className="absolute top-4 left-4 px-3 py-1.5 rounded text-[13px] font-semibold text-white select-none"
                  style={{ background: "rgba(0,0,0,0.6)" }}>
                  {activeIndex + 1} / {count}
                </div>
                
                {/* Expand icon — top right */}
                <button
                  className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded transition-all hover:bg-white/20"
                  style={{ background: "rgba(0,0,0,0.5)" }}
                  onClick={(e) => { e.stopPropagation(); openLightbox(activeIndex); }}
                  aria-label="Fullscreen"
                >
                  <Maximize2 size={16} color="#fff" />
                </button>
              </div>

              {/* Right preview — 18% width */}
              {count > 1 && (
                <div
                  className="relative flex-shrink-0 cursor-pointer overflow-hidden"
                  style={{ width: "18%", background: "#111" }}
                  onClick={() => isLocked(nextIdx) ? setLockModalOpen(true) : nextGal()}
                >
                  <img 
                    src={highQualityUrl(images[nextIdx])} 
                    alt="" 
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    style={{ opacity: 0.6 }}
                    draggable={false} 
                  />
                  {isLocked(nextIdx) && (
                    <div className="absolute inset-0 flex items-center justify-center"
                      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}>
                      <Lock size={24} color="#fff" />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Navigation arrows */}
            {count > 1 && (
              <>
                <button
                  onClick={prevGal}
                  className="absolute left-[17%] top-1/2 -translate-y-1/2 z-20 w-11 h-11 flex items-center justify-center transition-all hover:scale-110 hover:bg-black/70"
                  style={{ background: "rgba(0,0,0,0.55)", borderRadius: 4 }}
                >
                  <ChevronLeft size={22} color="#fff" />
                </button>
                <button
                  onClick={nextGal}
                  className="absolute right-[17%] top-1/2 -translate-y-1/2 z-20 w-11 h-11 flex items-center justify-center transition-all hover:scale-110 hover:bg-black/70"
                  style={{ background: "rgba(0,0,0,0.55)", borderRadius: 4 }}
                >
                  <ChevronRight size={22} color="#fff" />
                </button>
              </>
            )}
          </div>

          {/* Desktop thumbnail strip */}
          {count > 1 && (
            <div
              ref={thumbStripRef}
              className="flex items-center gap-2 px-4 py-3 overflow-x-auto [&::-webkit-scrollbar]:hidden"
              style={{ background: "#111" }}
            >
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className="relative flex-shrink-0 overflow-hidden rounded transition-all duration-200"
                  style={{
                    width: 70,
                    height: 70,
                    opacity: i === activeIndex ? 1 : 0.5,
                    outline: i === activeIndex ? "2px solid #DC2626" : "none",
                    outlineOffset: 2,
                  }}
                >
                  <img src={highQualityUrl(img, 140)} alt="" className="w-full h-full object-cover" draggable={false} />
                  {isLocked(i) && (
                    <div className="absolute inset-0 flex items-center justify-center"
                      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
                      <Lock size={14} color="#fff" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── MOBILE: Full-width single image ────────────────── */}
        <div
          className="md:hidden"
          onTouchStart={handleGalTouchStart}
          onTouchEnd={handleGalTouchEnd}
        >
          <div
            className="relative cursor-pointer"
            style={{ aspectRatio: "3/4", maxHeight: "70vh" }}
            onClick={() => openLightbox(activeIndex)}
          >
            <img
              src={highQualityUrl(images[activeIndex])}
              alt={`${name} photo ${activeIndex + 1}`}
              className="w-full h-full object-cover"
              draggable={false}
            />
            <div className="absolute top-3 right-3 px-2.5 py-1 rounded text-[12px] font-semibold text-white select-none"
              style={{ background: "rgba(0,0,0,0.55)" }}>
              {activeIndex + 1} / {count}
            </div>
            <button
              className="absolute top-3 left-3 w-10 h-10 flex items-center justify-center rounded"
              style={{ background: "rgba(0,0,0,0.5)" }}
              onClick={(e) => { e.stopPropagation(); openLightbox(activeIndex); }}
            >
              <Maximize2 size={16} color="#fff" />
            </button>
          </div>

          {/* Mobile thumbnail strip */}
          {count > 1 && (
            <div className="flex gap-1.5 px-3 py-2.5 overflow-x-auto [&::-webkit-scrollbar]:hidden"
              style={{ background: "#111" }}>
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className="relative flex-shrink-0 overflow-hidden rounded"
                  style={{
                    width: 52,
                    height: 52,
                    opacity: i === activeIndex ? 1 : 0.5,
                    outline: i === activeIndex ? "2px solid #fff" : "none",
                    outlineOffset: 1,
                  }}
                >
                  <img src={highQualityUrl(img, 120)} alt="" className="w-full h-full object-cover" draggable={false} />
                  {isLocked(i) && (
                    <div className="absolute inset-0 flex items-center justify-center"
                      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}>
                      <Lock size={12} color="#fff" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════
          LIGHTBOX
          ════════════════════════════════════════════════════════ */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.95)" }}
          onClick={closeLightbox}
          onTouchStart={handleLbTouchStart}
          onTouchEnd={handleLbTouchEnd}
        >
          <div
            className="relative flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "92vw", maxHeight: "92vh" }}
          >
            <img
              src={highQualityUrl(images[lightboxIndex])}
              alt={`${name} photo ${lightboxIndex + 1}`}
              style={{
                maxWidth: "92vw",
                maxHeight: "92vh",
                objectFit: "contain",
                pointerEvents: "none",
                userSelect: "none",
              }}
              draggable={false}
            />

            {/* Watermark */}
            <div className="absolute bottom-4 right-4 pointer-events-none select-none">
              <span className="text-[13px] font-semibold tracking-wider uppercase text-white/60"
                style={{ textShadow: "1px 1px 3px rgba(0,0,0,0.85)" }}>
                REDLIGHTAD.COM
              </span>
            </div>

            <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[12px] font-semibold text-white select-none"
              style={{ background: "rgba(0,0,0,0.55)" }}>
              {lightboxIndex + 1} / {count}
            </div>
          </div>

          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 w-11 h-11 flex items-center justify-center rounded-full transition-all hover:bg-white/20"
            style={{ background: "rgba(255,255,255,0.12)" }}
          >
            <X size={20} color="#fff" />
          </button>

          {count > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); lbPrev(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-full transition-all hover:bg-white/20"
                style={{ background: "rgba(255,255,255,0.12)" }}
              >
                <ChevronLeft size={22} color="#fff" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); lbNext(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-full transition-all hover:bg-white/20"
                style={{ background: "rgba(255,255,255,0.12)" }}
              >
                <ChevronRight size={22} color="#fff" />
              </button>
            </>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          LOCK MODAL
          ════════════════════════════════════════════════════════ */}
      {lockModalOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.55)" }}
          onClick={() => setLockModalOpen(false)}
        >
          <div
            className="relative w-full max-w-sm bg-white rounded-2xl p-8 text-center"
            style={{ boxShadow: "0 24px 60px rgba(0,0,0,0.18)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setLockModalOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full transition-colors hover:bg-gray-100"
            >
              <X size={16} color="#9CA3AF" />
            </button>

            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{ background: "#F5F5F7" }}>
              <Lock size={24} color="#111" strokeWidth={1.8} />
            </div>

            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {t.photo_create_free_title}<br />{t.photo_see_all}
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              {t.photo_registration_free}
            </p>

            <div className="flex flex-col gap-3">
              <Link
                href="/register"
                className="block w-full py-3 rounded-xl text-[15px] font-semibold text-white text-center bg-black"
                onClick={() => setLockModalOpen(false)}
              >
                {t.photo_create_btn}
              </Link>
              <Link
                href="/login"
                className="block w-full py-3 rounded-xl text-[15px] font-medium text-gray-700 text-center border border-gray-200 hover:bg-gray-50"
                onClick={() => setLockModalOpen(false)}
              >
                {t.photo_login}
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
