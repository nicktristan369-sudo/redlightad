"use client"

import { useState, useRef, useEffect } from "react"
import { Mic, Square, Upload, Trash2 } from "lucide-react"

interface VoiceRecorderProps {
  onUpload: (url: string) => void
  existingUrl?: string | null
}

export default function VoiceRecorder({ onUpload, existingUrl }: VoiceRecorderProps) {
  const [recording, setRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(existingUrl || null)
  const [seconds, setSeconds] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const MAX_SECS = 60

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  const startRecording = async () => {
    setError("")
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" })
      chunksRef.current = []
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" })
        setAudioBlob(blob)
        setAudioUrl(URL.createObjectURL(blob))
        stream.getTracks().forEach(t => t.stop())
      }
      mr.start()
      mediaRecorderRef.current = mr
      setRecording(true)
      setSeconds(0)
      timerRef.current = setInterval(() => {
        setSeconds(s => {
          if (s + 1 >= MAX_SECS) { stopRecording(); return MAX_SECS }
          return s + 1
        })
      }, 1000)
    } catch {
      setError("Kunne ikke tilgå mikrofon. Giv adgang og prøv igen.")
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop()
    }
    setRecording(false)
    if (timerRef.current) clearInterval(timerRef.current)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAudioBlob(file)
    setAudioUrl(URL.createObjectURL(file))
  }

  const uploadToCloudinary = async () => {
    if (!audioBlob) return
    setUploading(true)
    setError("")
    try {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "drxpitjyw"
      const preset = (process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "redlightad_unsigned").trim()
      const fd = new FormData()
      fd.append("file", audioBlob, "voice_message.webm")
      fd.append("upload_preset", preset)
      fd.append("resource_type", "video") // Cloudinary uses "video" for audio
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/video/upload`, {
        method: "POST", body: fd,
      })
      const data = await res.json()
      if (data.secure_url) {
        onUpload(data.secure_url)
        setError("")
      } else {
        throw new Error("Upload fejlede")
      }
    } catch {
      setError("Upload fejlede. Prøv igen.")
    } finally {
      setUploading(false)
    }
  }

  const discard = () => {
    setAudioBlob(null)
    setAudioUrl(null)
    setSeconds(0)
    onUpload("")
  }

  const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-red-500">{error}</p>}

      {!audioUrl ? (
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Record button */}
          {!recording ? (
            <button
              type="button"
              onClick={startRecording}
              className="flex items-center gap-2 rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Mic className="w-4 h-4 text-red-500" />
              Optag
            </button>
          ) : (
            <button
              type="button"
              onClick={stopRecording}
              className="flex items-center gap-2 rounded-xl border border-red-300 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600 transition-colors"
            >
              <Square className="w-4 h-4 fill-red-500 text-red-500" />
              Stop — {fmt(seconds)} / 1:00
            </button>
          )}

          {/* Upload file */}
          <label className="flex items-center gap-2 rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer">
            <Upload className="w-4 h-4" />
            Upload lydfil
            <input
              type="file"
              accept="audio/*,.mp3,.wav,.m4a,.webm"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <audio controls src={audioUrl} className="w-full h-8 mb-3" />
          <div className="flex gap-2">
            {audioBlob && (
              <button
                type="button"
                onClick={uploadToCloudinary}
                disabled={uploading}
                className="flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black disabled:opacity-50 transition-colors"
              >
                {uploading ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : <Upload className="w-4 h-4" />}
                {uploading ? "Uploader..." : "Gem voice message"}
              </button>
            )}
            <button
              type="button"
              onClick={discard}
              className="flex items-center gap-2 rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Slet
            </button>
          </div>
        </div>
      )}

      <p className="text-xs text-gray-400">Max 60 sekunder · MP3, WAV, M4A</p>
    </div>
  )
}
