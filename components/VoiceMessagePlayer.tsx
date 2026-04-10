"use client"

import { useState, useRef, useEffect } from "react"

interface VoiceMessagePlayerProps {
  url: string
  compact?: boolean
}

// Convert Cloudinary webm URL to mp3 for Safari/iOS compatibility
function toMp3Url(url: string): string {
  if (!url) return url
  try {
    const u = new URL(url)
    if (u.hostname.includes("cloudinary.com")) {
      const withoutExt = u.pathname.replace(/\.(webm|ogg|opus|wav)$/i, "")
      u.pathname = withoutExt.replace("/video/upload/", "/video/upload/f_mp3/")
      return u.toString()
    }
  } catch {}
  return url
}

export default function VoiceMessagePlayer({ url, compact = false }: VoiceMessagePlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [current, setCurrent] = useState(0)
  const [loadError, setLoadError] = useState(false)

  const mp3Url = toMp3Url(url)

  const fmt = (s: number) => {
    if (!isFinite(s) || s <= 0) return "0:00"
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, "0")}`
  }

  // Set src directly and load — more reliable than <source> children
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !url) return

    // Try mp3 first, fall back to original on error
    audio.src = mp3Url
    audio.load()

    const onLoaded = () => {
      setDuration(audio.duration)
      setLoadError(false)
    }
    const onTime = () => {
      setCurrent(audio.currentTime)
      setProgress(audio.duration ? (audio.currentTime / audio.duration) * 100 : 0)
    }
    const onEnd = () => { setPlaying(false); setProgress(0); setCurrent(0); audio.currentTime = 0 }
    const onError = () => {
      // mp3 failed — try original url
      if (audio.src !== url) {
        audio.src = url
        audio.load()
      } else {
        setLoadError(true)
      }
    }

    audio.addEventListener("loadedmetadata", onLoaded)
    audio.addEventListener("timeupdate", onTime)
    audio.addEventListener("ended", onEnd)
    audio.addEventListener("error", onError)

    return () => {
      audio.removeEventListener("loadedmetadata", onLoaded)
      audio.removeEventListener("timeupdate", onTime)
      audio.removeEventListener("ended", onEnd)
      audio.removeEventListener("error", onError)
      audio.pause()
      audio.src = ""
    }
  }, [url, mp3Url])

  const toggle = async () => {
    const audio = audioRef.current
    if (!audio) return
    if (playing) {
      audio.pause()
      setPlaying(false)
    } else {
      try {
        await audio.play()
        setPlaying(true)
      } catch (e) {
        console.error("Audio play failed:", e)
        setPlaying(false)
      }
    }
  }

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current
    if (!audio || !audio.duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    audio.currentTime = pct * audio.duration
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2 mt-2">
        <audio ref={audioRef} preload="metadata" />
        <button onClick={toggle}
          className="w-7 h-7 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0 hover:bg-black transition-colors">
          {playing
            ? <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><rect x="5" y="4" width="3" height="12" rx="0.5"/><rect x="12" y="4" width="3" height="12" rx="0.5"/></svg>
            : <svg className="w-3 h-3 text-white ml-0.5" fill="currentColor" viewBox="0 0 20 20"><path d="M6.5 4.5v11l9-5.5-9-5.5z"/></svg>}
        </button>
        <div className="flex-1 h-1.5 bg-gray-200 rounded-full cursor-pointer" onClick={seek}>
          <div className="h-1.5 bg-gray-900 rounded-full" style={{ width: `${progress}%` }} />
        </div>
        <span className="text-[11px] text-gray-400 flex-shrink-0 tabular-nums">{fmt(current)}</span>
      </div>
    )
  }

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
      <audio ref={audioRef} preload="metadata" />
      <div className="mb-4 flex items-center gap-2">
        <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3zm-1 3a1 1 0 0 1 2 0v8a1 1 0 0 1-2 0V4zM7 9.5A5 5 0 0 0 17 9.5v1a7 7 0 0 1-4 6.32V19h3v2H8v-2h3v-2.18A7 7 0 0 1 7 10.5v-1z"/>
        </svg>
        <h3 className="font-semibold text-gray-900">Voice Message</h3>
        <span className="ml-auto text-xs text-gray-400">{fmt(duration)}</span>
      </div>

      {loadError ? (
        <p className="text-xs text-red-500">Could not load audio file.</p>
      ) : (
        <div className="flex items-center gap-4">
          <button onClick={toggle}
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-gray-900 text-white hover:bg-black transition-colors">
            {playing
              ? <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><rect x="5" y="4" width="3" height="12" rx="0.5"/><rect x="12" y="4" width="3" height="12" rx="0.5"/></svg>
              : <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 20 20"><path d="M6.5 4.5v11l9-5.5-9-5.5z"/></svg>}
          </button>
          <div className="flex-1">
            <div className="h-2 w-full rounded-full bg-gray-100 cursor-pointer" onClick={seek}>
              <div className="h-2 rounded-full bg-red-600 transition-all" style={{ width: `${progress}%` }} />
            </div>
            <div className="mt-1 flex justify-between text-[11px] text-gray-400 tabular-nums">
              <span>{fmt(current)}</span>
              <span>{fmt(duration)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Debug: native fallback */}
      <details className="mt-3">
        <summary className="text-[10px] text-gray-300 cursor-pointer select-none">native player</summary>
        <audio controls src={url} className="w-full mt-1" style={{ height: 32 }} />
      </details>
    </div>
  )
}
