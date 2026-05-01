"use client";

import { useEffect, useState, useCallback } from "react";
import AdminLayout from "@/components/AdminLayout";
import { Search, Eye, Trash2, Flag, Play, X, ChevronLeft, ChevronRight, Clock, MapPin, User } from "lucide-react";
import Image from "next/image";

interface Story {
  id: string;
  listing_id: string;
  media_url: string;
  media_type: string;
  caption: string | null;
  views: number;
  created_at: string;
  expires_at: string;
  listing: {
    id: string;
    display_name: string;
    profile_image: string | null;
    city: string | null;
    country: string | null;
  } | null;
}

export default function AdminStories() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewerOpen, setViewerOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchStories = useCallback(async () => {
    setLoading(true);
    try {
      const { createClient } = await import("@/lib/supabase");
      const { data: { session } } = await createClient().auth.getSession();
      
      const res = await fetch("/api/admin/stories", {
        headers: { "Authorization": `Bearer ${session?.access_token}` },
      });
      
      if (res.ok) {
        const data = await res.json();
        setStories(data.stories || []);
      }
    } catch (err) {
      console.error("Failed to fetch stories:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  const deleteStory = async (id: string) => {
    if (!confirm("Slet denne story?")) return;
    setDeleting(id);
    try {
      const { createClient } = await import("@/lib/supabase");
      const { data: { session } } = await createClient().auth.getSession();
      
      const res = await fetch(`/api/admin/stories?id=${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${session?.access_token}` },
      });
      
      if (res.ok) {
        setStories(prev => prev.filter(s => s.id !== id));
        if (viewerOpen && stories[activeIndex]?.id === id) {
          setViewerOpen(false);
        }
      }
    } catch (err) {
      console.error("Failed to delete story:", err);
    } finally {
      setDeleting(null);
    }
  };

  const filteredStories = stories.filter(s => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.listing?.display_name?.toLowerCase().includes(q) ||
      s.listing?.city?.toLowerCase().includes(q) ||
      s.listing?.country?.toLowerCase().includes(q) ||
      s.caption?.toLowerCase().includes(q)
    );
  });

  const timeAgo = (iso: string) => {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (diff < 60) return `${diff}s`;
    const m = Math.floor(diff / 60);
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}t`;
    const d = Math.floor(h / 24);
    return `${d}d`;
  };

  const timeUntilExpiry = (iso: string) => {
    const diff = Math.floor((new Date(iso).getTime() - Date.now()) / 1000);
    if (diff <= 0) return "Udløbet";
    const h = Math.floor(diff / 3600);
    if (h < 1) return `${Math.floor(diff / 60)}m tilbage`;
    return `${h}t tilbage`;
  };

  const openViewer = (index: number) => {
    setActiveIndex(index);
    setViewerOpen(true);
  };

  const nextStory = () => {
    if (activeIndex < filteredStories.length - 1) {
      setActiveIndex(activeIndex + 1);
    }
  };

  const prevStory = () => {
    if (activeIndex > 0) {
      setActiveIndex(activeIndex - 1);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Stories</h1>
            <p className="text-sm text-gray-500">{stories.length} aktive stories</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Søg efter navn, by, land..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full max-w-md pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gray-400"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <p className="text-2xl font-bold text-gray-900">{stories.length}</p>
            <p className="text-xs text-gray-500">Aktive Stories</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <p className="text-2xl font-bold text-blue-600">{stories.reduce((a, s) => a + s.views, 0)}</p>
            <p className="text-xs text-gray-500">Totale Views</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <p className="text-2xl font-bold text-purple-600">{stories.filter(s => s.media_type === "video").length}</p>
            <p className="text-xs text-gray-500">Videoer</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <p className="text-2xl font-bold text-green-600">{new Set(stories.map(s => s.listing_id)).size}</p>
            <p className="text-xs text-gray-500">Profiler med Stories</p>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-gray-200 border-t-red-600 rounded-full animate-spin" />
          </div>
        ) : filteredStories.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            {search ? "Ingen stories matcher din søgning" : "Ingen aktive stories"}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {filteredStories.map((story, idx) => (
              <div
                key={story.id}
                className="relative bg-gray-900 rounded-xl overflow-hidden aspect-[9/16] group cursor-pointer"
                onClick={() => openViewer(idx)}
              >
                {/* Media */}
                {story.media_type === "video" ? (
                  <>
                    <video
                      src={story.media_url}
                      className="w-full h-full object-cover"
                      muted
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center">
                        <Play size={24} className="text-white ml-1" fill="white" />
                      </div>
                    </div>
                  </>
                ) : (
                  <Image
                    src={story.media_url}
                    alt=""
                    fill
                    className="object-cover"
                  />
                )}

                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />

                {/* Top info */}
                <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-7 h-7 rounded-full overflow-hidden bg-gray-700 border-2 border-white">
                      {story.listing?.profile_image ? (
                        <Image
                          src={story.listing.profile_image}
                          alt=""
                          width={28}
                          height={28}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white text-[10px]">
                          {story.listing?.display_name?.[0] || "?"}
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] font-medium text-white truncate max-w-[80px]">
                      {story.listing?.display_name || "Unknown"}
                    </span>
                  </div>
                  <span className="text-[9px] text-white/70">{timeAgo(story.created_at)}</span>
                </div>

                {/* Bottom info */}
                <div className="absolute bottom-2 left-2 right-2">
                  <div className="flex items-center justify-between text-[10px] text-white/80 mb-1">
                    <span className="flex items-center gap-1">
                      <Eye size={12} /> {story.views}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={10} /> {timeUntilExpiry(story.expires_at)}
                    </span>
                  </div>
                  {story.listing?.city && (
                    <p className="text-[9px] text-white/60 truncate flex items-center gap-1">
                      <MapPin size={10} />
                      {[story.listing.city, story.listing.country].filter(Boolean).join(", ")}
                    </p>
                  )}
                </div>

                {/* Delete button on hover */}
                <button
                  onClick={(e) => { e.stopPropagation(); deleteStory(story.id); }}
                  disabled={deleting === story.id}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                >
                  {deleting === story.id ? (
                    <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Trash2 size={14} />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Story Viewer Modal */}
      {viewerOpen && filteredStories[activeIndex] && (
        <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center">
          {/* Close button */}
          <button
            onClick={() => setViewerOpen(false)}
            className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20"
          >
            <X size={24} />
          </button>

          {/* Navigation */}
          {activeIndex > 0 && (
            <button
              onClick={prevStory}
              className="absolute left-4 z-50 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20"
            >
              <ChevronLeft size={24} />
            </button>
          )}
          {activeIndex < filteredStories.length - 1 && (
            <button
              onClick={nextStory}
              className="absolute right-4 z-50 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20"
            >
              <ChevronRight size={24} />
            </button>
          )}

          {/* Story content */}
          <div className="relative w-full max-w-md h-full max-h-[90vh] mx-auto">
            {filteredStories[activeIndex].media_type === "video" ? (
              <video
                src={filteredStories[activeIndex].media_url}
                className="w-full h-full object-contain"
                controls
                autoPlay
              />
            ) : (
              <Image
                src={filteredStories[activeIndex].media_url}
                alt=""
                fill
                className="object-contain"
              />
            )}

            {/* Profile info overlay */}
            <div className="absolute top-4 left-4 right-16 flex items-center gap-3 z-40">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-700 border-2 border-white">
                {filteredStories[activeIndex].listing?.profile_image ? (
                  <Image
                    src={filteredStories[activeIndex].listing.profile_image}
                    alt=""
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white">
                    <User size={20} />
                  </div>
                )}
              </div>
              <div>
                <p className="text-white font-semibold text-sm">
                  {filteredStories[activeIndex].listing?.display_name || "Unknown"}
                </p>
                <p className="text-white/60 text-xs flex items-center gap-1">
                  <MapPin size={10} />
                  {[filteredStories[activeIndex].listing?.city, filteredStories[activeIndex].listing?.country].filter(Boolean).join(", ") || "Unknown"}
                </p>
              </div>
            </div>

            {/* Caption */}
            {filteredStories[activeIndex].caption && (
              <div className="absolute bottom-20 left-4 right-4 z-40">
                <p className="text-white text-sm bg-black/50 rounded-lg px-3 py-2">
                  {filteredStories[activeIndex].caption}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="absolute bottom-4 left-4 right-4 z-40 flex items-center justify-between">
              <div className="flex items-center gap-4 text-white/80 text-sm">
                <span className="flex items-center gap-1">
                  <Eye size={16} /> {filteredStories[activeIndex].views} views
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={14} /> {timeUntilExpiry(filteredStories[activeIndex].expires_at)}
                </span>
              </div>
              <button
                onClick={() => deleteStory(filteredStories[activeIndex].id)}
                disabled={deleting === filteredStories[activeIndex].id}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700"
              >
                <Trash2 size={16} />
                Slet Story
              </button>
            </div>
          </div>

          {/* Story counter */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">
            {activeIndex + 1} / {filteredStories.length}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
