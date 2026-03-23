"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, Maximize2, Lock } from "lucide-react";
import Link from "next/link";

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

  // Image 0 is always free — index 1+ requires login
  const isLocked = (index: number) => !isLoggedIn && index > 0;

  // ── Auto-slide every 3s across ALL images ───────────────────
  const startAutoSlide = useCallback(() => {
    if (autoSlideRef.current) clearInterval(autoSlideRef.current);
    if (count <= 1) return;
    autoSlideRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % count);
    }, 3000);
  }, [count]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // ── Gallery navigation ───────────────────────────────────────
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
  }, [scheduleRestart, isLoggedIn]); // eslint-disable-line react-hooks/exhaustive-deps

  const prevGal = () => {
    const idx = (activeIndex - 1 + count) % count;
    // Find closest non-locked going backwards
    for (let i = 1; i <= count; i++) {
      const candidate = (activeIndex - i + count) % count;
      if (!isLocked(candidate)) { goTo(candidate); return; }
    }
  };
  const nextGal = () => {
    // Find closest non-locked going forward
    for (let i = 1; i <= count; i++) {
      const candidate = (activeIndex + i) % count;
      if (!isLocked(candidate)) { goTo(candidate); return; }
    }
  };

  // ── Lightbox ─────────────────────────────────────────────────
  const openLightbox = useCallback((index: number) => {
    if (isLocked(index)) {
      setLockModalOpen(true);
      return;
    }
    setLightboxIndex(index);
    setLightboxOpen(true);
    if (autoSlideRef.current) clearInterval(autoSlideRef.current);
  }, [isLoggedIn]); // eslint-disable-line react-hooks/exhaustive-deps

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false);
    scheduleRestart();
  }, [scheduleRestart]);

  const lbPrev = useCallback(() =>
    setLightboxIndex((i) => (i - 1 + count) % count), [count]);
  const lbNext = useCallback(() =>
    setLightboxIndex((i) => (i + 1) % count), [count]);

  // Keyboard navigation
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

  // Lock modal — Escape closes
  useEffect(() => {
    if (!lockModalOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setLockModalOpen(false); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lockModalOpen]);

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = (lightboxOpen || lockModalOpen) ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [lightboxOpen, lockModalOpen]);

  // ── Touch/swipe handlers ─────────────────────────────────────
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

  // Locked image overlay (reusable)
  const LockedOverlay = () => (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center gap-2"
      style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(8px)" }}
    >
      <div className="flex items-center justify-center rounded-full"
        style={{ width: 36, height: 36, background: "rgba(255,255,255,0.15)" }}>
        <Lock size={16} color="#fff" />
      </div>
      <span className="text-[11px] font-semibold text-white/80 tracking-wide uppercase">
        Gratis konto
      </span>
    </div>
  );

  return (
    <>
      {/* ════════════════════════════════════════════════════════
          GALLERY — inline on ad page
          ════════════════════════════════════════════════════════ */}
      <div className="rounded-sm overflow-hidden border border-[#E5E5E5]">

        {/* ── DESKTOP: 3-panel layout ─────────────────────────── */}
        <div className="hidden md:block">
          <div
            className="relative flex items-center justify-center gap-3 px-10 py-5"
            style={{ background: "#1C1C1E", minHeight: "320px" }}
          >
            {/* Left arrow */}
            {count > 1 && (
              <button
                onClick={prevGal}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center rounded transition-all hover:bg-white/25"
                style={{ width: 36, height: 36, background: "rgba(255,255,255,0.14)" }}
              >
                <ChevronLeft size={20} color="#fff" />
              </button>
            )}

            {/* Left image — dimmed */}
            {count > 1 && (
              <div
                className="relative flex-shrink-0 overflow-hidden rounded cursor-pointer transition-opacity duration-300 hover:opacity-60"
                style={{ width: "20%", aspectRatio: "3/4", opacity: 0.4 }}
                onClick={() => isLocked(prevIdx) ? setLockModalOpen(true) : prevGal()}
              >
                <img src={images[prevIdx]} alt="" className="w-full h-full object-cover" draggable={false} />
                {isLocked(prevIdx) && (
                  <div className="absolute inset-0 flex items-center justify-center"
                    style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}>
                    <Lock size={18} color="#fff" />
                  </div>
                )}
              </div>
            )}

            {/* Center image — active */}
            <div
              className="relative flex-1 overflow-hidden rounded cursor-pointer group"
              style={{ aspectRatio: "3/4", maxHeight: "380px", maxWidth: "340px" }}
              onClick={() => openLightbox(activeIndex)}
            >
              <img
                src={images[activeIndex]}
                alt={`${name} photo ${activeIndex + 1}`}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.015]"
                draggable={false}
              />
              {/* Counter — all images */}
              <div className="absolute top-2.5 left-3 rounded px-2.5 py-1 text-[12px] font-semibold text-white select-none"
                style={{ background: "rgba(0,0,0,0.55)" }}>
                {activeIndex + 1} / {count}
              </div>
              {/* Expand */}
              <button
                className="absolute top-2.5 right-2.5 flex items-center justify-center rounded transition-colors hover:bg-black/70"
                style={{ width: 30, height: 30, background: "rgba(0,0,0,0.50)" }}
                onClick={(e) => { e.stopPropagation(); openLightbox(activeIndex); }}
                aria-label="Fullscreen"
              >
                <Maximize2 size={13} color="#fff" />
              </button>
            </div>

            {/* Right image — dimmed */}
            {count > 1 && (
              <div
                className="relative flex-shrink-0 overflow-hidden rounded cursor-pointer transition-opacity duration-300 hover:opacity-60"
                style={{ width: "20%", aspectRatio: "3/4", opacity: 0.4 }}
                onClick={() => isLocked(nextIdx) ? setLockModalOpen(true) : nextGal()}
              >
                <img src={images[nextIdx]} alt="" className="w-full h-full object-cover" draggable={false} />
                {isLocked(nextIdx) && (
                  <div className="absolute inset-0 flex items-center justify-center"
                    style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}>
                    <Lock size={18} color="#fff" />
                  </div>
                )}
              </div>
            )}

            {/* Right arrow */}
            {count > 1 && (
              <button
                onClick={nextGal}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center rounded transition-all hover:bg-white/25"
                style={{ width: 36, height: 36, background: "rgba(255,255,255,0.14)" }}
              >
                <ChevronRight size={20} color="#fff" />
              </button>
            )}
          </div>

          {/* Desktop thumbnail strip */}
          {count > 1 && (
            <div
              ref={thumbStripRef}
              className="flex items-center gap-1.5 px-4 py-3 overflow-x-auto [&::-webkit-scrollbar]:hidden"
              style={{ background: "#111" }}
            >
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className="relative flex-shrink-0 overflow-hidden rounded transition-all duration-200"
                  style={{
                    width: 52, height: 52,
                    opacity: i === activeIndex ? 1 : 0.45,
                    outline: i === activeIndex ? "2px solid #fff" : "2px solid transparent",
                    outlineOffset: "1px",
                  }}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" draggable={false} />
                  {isLocked(i) && (
                    <div className="absolute inset-0 flex items-center justify-center"
                      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}>
                      <Lock size={12} color="rgba(255,255,255,0.9)" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── MOBILE: fullscreen single + swipe ───────────────── */}
        <div
          className="md:hidden mx-3"
          style={{ background: "#1C1C1E" }}
          onTouchStart={handleGalTouchStart}
          onTouchEnd={handleGalTouchEnd}
        >
          <div
            className="relative cursor-pointer"
            style={{ height: "60vh" }}
            onClick={() => openLightbox(activeIndex)}
          >
            <img
              src={images[activeIndex]}
              alt={`${name} photo ${activeIndex + 1}`}
              className="w-full h-full object-cover"
              draggable={false}
            />
            <div className="absolute top-3 right-3 rounded px-2.5 py-1 text-[12px] font-semibold text-white select-none"
              style={{ background: "rgba(0,0,0,0.55)" }}>
              {activeIndex + 1} / {count}
            </div>
            <button
              className="absolute top-3 left-3 flex items-center justify-center rounded"
              style={{ width: 30, height: 30, background: "rgba(0,0,0,0.50)" }}
              onClick={(e) => { e.stopPropagation(); openLightbox(activeIndex); }}
            >
              <Maximize2 size={13} color="#fff" />
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
                  className="relative flex-shrink-0 overflow-hidden"
                  style={{
                    width: 44, height: 44,
                    opacity: i === activeIndex ? 1 : 0.45,
                    outline: i === activeIndex ? "2px solid #fff" : "none",
                    outlineOffset: "1px",
                  }}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" draggable={false} />
                  {isLocked(i) && (
                    <div className="absolute inset-0 flex items-center justify-center"
                      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}>
                      <Lock size={11} color="rgba(255,255,255,0.9)" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════
          LIGHTBOX — fullscreen med vandmærke
          ════════════════════════════════════════════════════════ */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.95)" }}
          onClick={closeLightbox}
          onTouchStart={handleLbTouchStart}
          onTouchEnd={handleLbTouchEnd}
        >
          {/* Image + watermark wrapper */}
          <div
            className="relative flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "92vw", maxHeight: "92vh" }}
          >
            <img
              src={images[lightboxIndex]}
              alt={`${name} photo ${lightboxIndex + 1}`}
              style={{
                maxWidth: "92vw",
                maxHeight: "92vh",
                objectFit: "contain",
                borderRadius: 0,
                pointerEvents: "none",
                userSelect: "none",
                WebkitUserSelect: "none",
                display: "block",
              }}
              draggable={false}
            />

            {/* ── VANDMÆRKE — kun i lightbox ── */}
            <div
              style={{
                position: "absolute",
                bottom: "16px",
                right: "16px",
                pointerEvents: "none",
                userSelect: "none",
                WebkitUserSelect: "none",
                zIndex: 10,
              }}
            >
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.60)",
                  textShadow: "1px 1px 3px rgba(0,0,0,0.85), 0 0 8px rgba(0,0,0,0.55)",
                  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
                }}
              >
                REDLIGHTAD.COM
              </span>
            </div>

            {/* Counter — only unlocked images */}
            <div className="absolute top-3 left-3 text-[12px] font-semibold text-white rounded-full px-2.5 py-1 select-none"
              style={{ background: "rgba(0,0,0,0.55)" }}>
              {lightboxIndex + 1} / {count}
            </div>
          </div>

          {/* Close */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 flex items-center justify-center rounded transition-all hover:bg-white/20"
            style={{ width: 40, height: 40, background: "rgba(255,255,255,0.12)" }}
            aria-label="Close"
          >
            <X size={20} color="#fff" />
          </button>

          {/* Prev / Next */}
          {count > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); lbPrev(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center justify-center rounded transition-all hover:bg-white/20"
                style={{ width: 44, height: 44, background: "rgba(255,255,255,0.12)" }}
                aria-label="Previous"
              >
                <ChevronLeft size={22} color="#fff" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); lbNext(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center rounded transition-all hover:bg-white/20"
                style={{ width: 44, height: 44, background: "rgba(255,255,255,0.12)" }}
                aria-label="Next"
              >
                <ChevronRight size={22} color="#fff" />
              </button>
            </>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════
          LOCK MODAL — gratis konto krævet
          ════════════════════════════════════════════════════════ */}
      {lockModalOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.55)" }}
          onClick={() => setLockModalOpen(false)}
        >
          <div
            className="relative w-full max-w-sm bg-white rounded p-8 text-center"
            style={{ boxShadow: "0 24px 60px rgba(0,0,0,0.18)", border: "1px solid #E5E5E5" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button
              onClick={() => setLockModalOpen(false)}
              className="absolute top-4 right-4 flex items-center justify-center rounded transition-colors hover:bg-gray-100"
              style={{ width: 32, height: 32 }}
            >
              <X size={16} color="#9CA3AF" />
            </button>

            {/* Lock icon */}
            <div className="flex items-center justify-center rounded mx-auto mb-5"
              style={{ width: 56, height: 56, background: "#F5F5F7" }}>
              <Lock size={24} color="#111" strokeWidth={1.8} />
            </div>

            <h2 className="text-[20px] font-black text-gray-900 mb-2 leading-tight">
              Opret en gratis konto<br />for at se alle billeder
            </h2>
            <p className="text-[14px] text-gray-500 mb-7 leading-relaxed">
              Registrering er gratis og tager under 1 minut. Ingen betaling krævet.
            </p>

            <div className="flex flex-col gap-3">
              <Link
                href="/register"
                className="block w-full py-3 rounded text-[15px] font-semibold text-white text-center transition-colors"
                style={{ background: "#000" }}
                onClick={() => setLockModalOpen(false)}
              >
                Opret gratis konto
              </Link>
              <Link
                href="/login"
                className="block w-full py-3 rounded text-[15px] font-medium text-gray-700 text-center border border-[#E5E5E5] transition-colors hover:bg-gray-50"
                onClick={() => setLockModalOpen(false)}
              >
                Log ind
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
