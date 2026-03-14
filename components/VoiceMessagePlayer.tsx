"use client"

import { useState, useRef, useEffect } from "react"

interface VoiceMessagePlayerProps {
  url: string
  compact?: boolean
}

export default function VoiceMessagePlayer({ url, compact = false }: VoiceMessagePlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [current, setCurrent] = useState(0)

  const fmt = (s: number) => {
    if (!isFinite(s)) return "0:00"
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, "0")}`
  }

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onLoaded = () => setDuration(audio.duration)
    const onTime = () => {
      setCurrent(audio.currentTime)
      setProgress(audio.duration ? (audio.currentTime / audio.duration) * 100 : 0)
    }
    const onEnd = () => { setPlaying(false); setProgress(0); setCurrent(0) }
    audio.addEventListener("loadedmetadata", onLoaded)
    audio.addEventListener("timeupdate", onTime)
    audio.addEventListener("ended", onEnd)
    return () => {
      audio.removeEventListener("loadedmetadata", onLoaded)
      audio.removeEventListener("timeupdate", onTime)
      audio.removeEventListener("ended", onEnd)
    }
  }, [])

  const toggle = () => {
    const audio = audioRef.current
    if (!audio) return
    if (playing) { audio.pause(); setPlaying(false) }
    else { audio.play(); setPlaying(true) }
  }

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current
    if (!audio) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = (e.clientX - rect.left) / rect.width
    audio.currentTime = pct * audio.duration
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2 mt-2">
        <audio ref={audioRef} src={url} preload="metadata" />
        <button
          onClick={toggle}
          className="w-7 h-7 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0 hover:bg-black transition-colors"
        >
          {playing
            ? <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><rect x="5" y="4" width="3" height="12" rx="0.5" /><rect x="12" y="4" width="3" height="12" rx="0.5" /></svg>
            : <svg className="w-3 h-3 text-white ml-0.5" fill="currentColor" viewBox="0 0 20 20"><path d="M6.5 4.5v11l9-5.5-9-5.5z" /></svg>
          }
        </button>
        <div className="flex-1 h-1.5 bg-gray-200 rounded-full cursor-pointer" onClick={seek}>
          <div className="h-1.5 bg-gray-900 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
        <span className="text-[11px] text-gray-400 flex-shrink-0 tabular-nums">{fmt(current)}</span>
      </div>
    )
  }

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
      <audio ref={audioRef} src={url} preload="metadata" />
      <div className="mb-4 flex items-center gap-2">
        <span className="text-red-600 text-lg">🎙️</span>
        <h3 className="font-semibold text-gray-900">Stemmebesked</h3>
        <span className="ml-auto text-xs text-gray-400">{fmt(duration)}</span>
      </div>
      <div className="flex items-center gap-4">
        <button
          onClick={toggle}
          className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-gray-900 text-white hover:bg-black transition-colors"
        >
          {playing
            ? <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><rect x="5" y="4" width="3" height="12" rx="0.5" /><rect x="12" y="4" width="3" height="12" rx="0.5" /></svg>
            : <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 20 20"><path d="M6.5 4.5v11l9-5.5-9-5.5z" /></svg>
          }
        </button>
        <div className="flex-1">
          <div className="h-2 w-full rounded-full bg-gray-100 cursor-pointer" onClick={seek}>
            <div className="h-2 rounded-full bg-gray-900 transition-all" style={{ width: `${progress}%` }} />
          </div>
          <div className="mt-1 flex justify-between text-[11px] text-gray-400 tabular-nums">
            <span>{fmt(current)}</span>
            <span>{fmt(duration)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
