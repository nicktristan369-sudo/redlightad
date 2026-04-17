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
      const btn = thumbStripRef.current.children[index + 1] as HTMLElement | undefined; // +1 for left arrow
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

  // Double chevron icon for ts4rent style
  const DoubleChevronLeft = () => (
    <span className="text-[18px] font-bold text-white">«</span>
  );
  const DoubleChevronRight = () => (
    <span className="text-[18px] font-bold text-white">»</span>
  );

  return (
    <>
      {/* ════════════════════════════════════════════════════════
          GALLERY — TS4Rent Style
          ════════════════════════════════════════════════════════ */}
      <div className="relative overflow-hidden" style={{ background: "#1a1a1a" }}>

        {/* ── DESKTOP: 3-panel layout like ts4rent.de ─────────── */}
        <div className="hidden md:block">
          {/* Counter + Expand — absolute top right of entire gallery */}
          <div className="absolute top-3 right-3 z-30 flex items-center gap-0.5">
            <div className="px-2.5 py-1 text-[12px] font-semibold text-white select-none"
              style={{ background: "rgba(50,50,50,0.9)" }}>
              {activeIndex + 1} / {count}
            </div>
            <button
              className="w-8 h-8 flex items-center justify-center hover:bg-white/10 transition-colors"
              style={{ background: "rgba(50,50,50,0.9)" }}
              onClick={() => openLightbox(activeIndex)}
              aria-label="Fullscreen"
            >
              <Maximize2 size={14} color="#fff" />
            </button>
          </div>

          <div
            className="relative w-full flex items-stretch"
            style={{ height: 480 }}
            onTouchStart={handleGalTouchStart}
            onTouchEnd={handleGalTouchEnd}
          >
            {/* Left preview — 22% width, full height, object-cover */}
            {count > 1 && (
              <div
                className="relative flex-shrink-0 cursor-pointer overflow-hidden"
                style={{ width: "22%" }}
                onClick={() => isLocked(prevIdx) ? setLockModalOpen(true) : prevGal()}
              >
                <img 
                  src={highQualityUrl(images[prevIdx])} 
                  alt="" 
                  className="w-full h-full object-cover"
                  style={{ opacity: 0.65 }}
                  draggable={false} 
                />
                {isLocked(prevIdx) && (
                  <div className="absolute inset-0 flex items-center justify-center"
                    style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}>
                    <Lock size={28} color="#fff" />
                  </div>
                )}
              </div>
            )}

            {/* Center main image — fills remaining, object-contain to show full image */}
            <div
              className="relative flex-1 cursor-pointer overflow-hidden flex items-center justify-center"
              style={{ background: "#111" }}
              onClick={() => openLightbox(activeIndex)}
            >
              <img
                src={highQualityUrl(images[activeIndex])}
                alt={`${name} photo ${activeIndex + 1}`}
                className="max-w-full max-h-full object-contain"
                draggable={false}
              />
            </div>

            {/* Right preview — 22% width, full height, object-cover */}
            {count > 1 && (
              <div
                className="relative flex-shrink-0 cursor-pointer overflow-hidden"
                style={{ width: "22%" }}
                onClick={() => isLocked(nextIdx) ? setLockModalOpen(true) : nextGal()}
              >
                <img 
                  src={highQualityUrl(images[nextIdx])} 
                  alt="" 
                  className="w-full h-full object-cover"
                  style={{ opacity: 0.65 }}
                  draggable={false} 
                />
                {isLocked(nextIdx) && (
                  <div className="absolute inset-0 flex items-center justify-center"
                    style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}>
                    <Lock size={28} color="#fff" />
                  </div>
                )}
              </div>
            )}

            {/* Navigation arrows — at edge of gallery */}
            {count > 1 && (
              <>
                <button
                  onClick={prevGal}
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-10 flex items-center justify-center transition-all hover:bg-black/60"
                  style={{ background: "rgba(0,0,0,0.4)" }}
                >
                  <DoubleChevronLeft />
                </button>
                <button
                  onClick={nextGal}
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-10 flex items-center justify-center transition-all hover:bg-black/60"
                  style={{ background: "rgba(0,0,0,0.4)" }}
                >
                  <DoubleChevronRight />
                </button>
              </>
            )}
          </div>

          {/* Desktop thumbnail strip with navigation arrows */}
          {count > 1 && (
            <div className="flex items-center" style={{ background: "#1a1a1a" }}>
              {/* Left scroll arrow */}
              <button
                onClick={prevGal}
                className="flex-shrink-0 w-8 h-16 flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <DoubleChevronLeft />
              </button>
              
              {/* Thumbnails */}
              <div
                ref={thumbStripRef}
                className="flex-1 flex items-center gap-1.5 py-2.5 overflow-x-auto [&::-webkit-scrollbar]:hidden"
              >
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    className="relative flex-shrink-0 overflow-hidden transition-all duration-200"
                    style={{
                      width: 64,
                      height: 64,
                      opacity: i === activeIndex ? 1 : 0.5,
                      outline: i === activeIndex ? "2px solid #DC2626" : "none",
                      outlineOffset: 1,
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
              
              {/* Right scroll arrow */}
              <button
                onClick={nextGal}
                className="flex-shrink-0 w-8 h-16 flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <DoubleChevronRight />
              </button>
            </div>
          )}
        </div>

        {/* ── MOBILE ────────────────────────────────────────────── */}
        <div
          className="md:hidden"
          style={{ background: "#111" }}
          onTouchStart={handleGalTouchStart}
          onTouchEnd={handleGalTouchEnd}
        >
          {/* Counter + Expand — top right */}
          <div className="absolute top-2 right-2 z-30 flex items-center gap-0.5">
            <div className="px-2 py-1 text-[11px] font-semibold text-white select-none"
              style={{ background: "rgba(50,50,50,0.9)" }}>
              {activeIndex + 1} / {count}
            </div>
            <button
              className="w-7 h-7 flex items-center justify-center"
              style={{ background: "rgba(50,50,50,0.9)" }}
              onClick={() => openLightbox(activeIndex)}
            >
              <Maximize2 size={13} color="#fff" />
            </button>
          </div>

          <div
            className="relative flex items-center justify-center"
            style={{ minHeight: 300, maxHeight: "60vh" }}
            onClick={() => openLightbox(activeIndex)}
          >
            <img
              src={highQualityUrl(images[activeIndex])}
              alt={`${name} photo ${activeIndex + 1}`}
              className="max-w-full max-h-[60vh] object-contain"
              draggable={false}
            />
          </div>

          {/* Mobile thumbnail strip */}
          {count > 1 && (
            <div 
              ref={thumbStripRef}
              className="flex gap-1.5 px-3 py-2.5 overflow-x-auto [&::-webkit-scrollbar]:hidden"
              style={{ background: "#1a1a1a" }}
            >
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className="relative flex-shrink-0 overflow-hidden"
                  style={{
                    width: 48,
                    height: 48,
                    opacity: i === activeIndex ? 1 : 0.5,
                    outline: i === activeIndex ? "2px solid #DC2626" : "none",
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

            <div className="absolute bottom-4 right-4 pointer-events-none select-none">
              <span className="text-[13px] font-semibold tracking-wider uppercase text-white/60"
                style={{ textShadow: "1px 1px 3px rgba(0,0,0,0.85)" }}>
                REDLIGHTAD.COM
              </span>
            </div>

            <div className="absolute top-3 left-3 px-2.5 py-1 text-[12px] font-semibold text-white select-none"
              style={{ background: "rgba(0,0,0,0.55)" }}>
              {lightboxIndex + 1} / {count}
            </div>
          </div>

          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 w-11 h-11 flex items-center justify-center transition-all hover:bg-white/20"
            style={{ background: "rgba(255,255,255,0.12)" }}
          >
            <X size={20} color="#fff" />
          </button>

          {count > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); lbPrev(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center transition-all hover:bg-white/20"
                style={{ background: "rgba(255,255,255,0.12)" }}
              >
                <ChevronLeft size={22} color="#fff" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); lbNext(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center transition-all hover:bg-white/20"
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
            className="relative w-full max-w-sm bg-white p-8 text-center"
            style={{ boxShadow: "0 24px 60px rgba(0,0,0,0.18)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setLockModalOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center transition-colors hover:bg-gray-100"
            >
              <X size={16} color="#9CA3AF" />
            </button>

            <div className="w-14 h-14 flex items-center justify-center mx-auto mb-5"
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
                className="block w-full py-3 text-[15px] font-semibold text-white text-center bg-black"
                onClick={() => setLockModalOpen(false)}
              >
                {t.photo_create_btn}
              </Link>
              <Link
                href="/login"
                className="block w-full py-3 text-[15px] font-medium text-gray-700 text-center border border-gray-200 hover:bg-gray-50"
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
