"use client"

import { useState, useEffect } from "react"
import AdminLayout from "@/components/AdminLayout"
import { createClient } from "@/lib/supabase"
import { Play, CheckCircle, Loader, AlertCircle, Wand2 } from "lucide-react"

type Video = {
  id: string
  url: string
  thumbnail_url: string | null
  listing_id: string
  title: string | null
  listings: { title: string } | null
}

type JobState = {
  status: "idle" | "submitting" | "processing" | "done" | "failed"
  jobId?: string
  outputUrl?: string
  error?: string
  credits?: number
}

export default function VideoDewatermarkPage() {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [jobs, setJobs] = useState<Record<string, JobState>>({})

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from("listing_videos")
      .select("id, url, thumbnail_url, listing_id, title, listings(title)")
      .order("created_at", { ascending: false })
      .limit(100)
      .then(({ data }) => {
        setVideos((data ?? []) as unknown as Video[])
        setLoading(false)
      })
  }, [])

  const startJob = async (video: Video) => {
    setJobs(j => ({ ...j, [video.id]: { status: "submitting" } }))
    try {
      const res = await fetch("/api/admin/video-dewatermark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoUrl: video.url, videoId: video.id }),
      })
      const data = await res.json()
      if (!res.ok || !data.jobId) {
        setJobs(j => ({ ...j, [video.id]: { status: "failed", error: data.error } }))
        return
      }
      setJobs(j => ({ ...j, [video.id]: { status: "processing", jobId: data.jobId, credits: data.credits } }))
      pollJob(video.id, data.jobId)
    } catch (e) {
      setJobs(j => ({ ...j, [video.id]: { status: "failed", error: String(e) } }))
    }
  }

  const pollJob = async (videoId: string, jobId: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/admin/video-dewatermark?job_id=${jobId}&video_id=${videoId}`)
        const data = await res.json()
        if (data.status === "done") {
          clearInterval(interval)
          setJobs(j => ({ ...j, [videoId]: { status: "done", outputUrl: data.outputUrl } }))
          // Update URL in UI
          setVideos(vs => vs.map(v => v.id === videoId ? { ...v, url: data.outputUrl } : v))
        } else if (data.status === "failed") {
          clearInterval(interval)
          setJobs(j => ({ ...j, [videoId]: { status: "failed", error: "Behandling fejlede" } }))
        }
      } catch {}
    }, 5000)
  }

  const isDone = (video: Video) => jobs[video.id]?.status === "done"
  const isProcessing = (video: Video) => ["submitting", "processing"].includes(jobs[video.id]?.status ?? "")

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Video Watermark Fjerner</h1>
        <p className="text-sm text-gray-500 mt-1">
          Fjern vandmærker fra importerede videoer via unwatermark.ai · 1 credit/sek
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : videos.length === 0 ? (
        <div className="text-center py-16 text-gray-400">Ingen videoer fundet</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.map(video => {
            const job = jobs[video.id]
            return (
              <div key={video.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
                {/* Thumbnail */}
                <div className="relative bg-black" style={{ aspectRatio: "16/9" }}>
                  {video.thumbnail_url ? (
                    <img src={video.thumbnail_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <video src={`${video.url}#t=1`} preload="metadata" muted className="w-full h-full object-cover" style={{ pointerEvents: "none" }} />
                  )}
                  {isDone(video) && (
                    <div className="absolute inset-0 flex items-center justify-center bg-green-500/20">
                      <CheckCircle className="w-10 h-10 text-green-500" />
                    </div>
                  )}
                  {isProcessing(video) && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <Loader className="w-8 h-8 text-white animate-spin" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-3">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {(video.listings as any)?.title ?? "Ukendt profil"}
                  </p>
                  <p className="text-xs text-gray-400 truncate mt-0.5">{video.url.split("/").pop()}</p>

                  {job?.error && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <AlertCircle size={11} /> {job.error}
                    </p>
                  )}
                  {job?.status === "processing" && (
                    <p className="text-xs text-blue-500 mt-1">Behandler... ({job.credits ?? "?"} credits brugt)</p>
                  )}
                  {isDone(video) && (
                    <p className="text-xs text-green-600 mt-1 font-semibold">✅ Vandmærke fjernet</p>
                  )}

                  <button
                    onClick={() => startJob(video)}
                    disabled={isProcessing(video) || isDone(video)}
                    className="mt-3 w-full flex items-center justify-center gap-2 py-2 text-sm font-semibold rounded-lg transition-all"
                    style={{
                      background: isDone(video) ? "#D1FAE5" : isProcessing(video) ? "#E5E7EB" : "#111",
                      color: isDone(video) ? "#065F46" : isProcessing(video) ? "#9CA3AF" : "#fff",
                      cursor: (isProcessing(video) || isDone(video)) ? "not-allowed" : "pointer",
                    }}
                  >
                    {isProcessing(video) ? (
                      <><Loader size={14} className="animate-spin" /> Behandler...</>
                    ) : isDone(video) ? (
                      <><CheckCircle size={14} /> Færdig</>
                    ) : (
                      <><Wand2 size={14} /> Fjern vandmærke</>
                    )}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </AdminLayout>
  )
}
