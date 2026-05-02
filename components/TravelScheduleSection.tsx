"use client";

import { useEffect, useState } from "react";
import { MapPin, Plane, ChevronRight, X, Calendar } from "lucide-react";

interface TravelEntry {
  id: string;
  country: string;
  city: string;
  country_code: string;
  arrival_date: string;
  departure_date: string;
  is_current?: boolean;
}

function formatDateRange(arrival: string, departure: string): string {
  const start = new Date(arrival + "T00:00:00");
  const end = new Date(departure + "T00:00:00");
  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  return `${start.toLocaleDateString("en-US", options)} – ${end.toLocaleDateString("en-US", options)}`;
}

export default function TravelScheduleSection({ listingId }: { listingId: string }) {
  const [entries, setEntries] = useState<TravelEntry[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ city: string; country: string } | null>(null);

  useEffect(() => {
    fetch(`/api/travel?listing_id=${listingId}`)
      .then(r => r.json())
      .then(d => { 
        if (d.entries) {
          // Sort by date and mark current
          const today = new Date().toISOString().split('T')[0];
          const sorted = d.entries
            .map((e: TravelEntry) => ({
              ...e,
              is_current: e.arrival_date <= today && e.departure_date >= today
            }))
            .sort((a: TravelEntry, b: TravelEntry) => 
              new Date(a.arrival_date).getTime() - new Date(b.arrival_date).getTime()
            );
          setEntries(sorted);
          
          // Find current travel location
          const current = sorted.find((e: TravelEntry) => e.is_current);
          if (current) {
            setCurrentLocation({ city: current.city, country: current.country });
          }
        }
      })
      .catch(() => {});
  }, [listingId]);

  if (entries.length === 0) return null;

  // Get next upcoming travel (not current)
  const today = new Date().toISOString().split('T')[0];
  const upcomingTravels = entries.filter(e => e.arrival_date > today && !e.is_current);
  const nextTravel = upcomingTravels[0];
  const activeTravel = entries.find(e => e.is_current);

  return (
    <>
      {/* Elegant Travel Card */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {/* Current Location - if traveling */}
        {activeTravel && (
          <div className="p-4 border-b border-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                <MapPin size={18} className="text-red-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Current Location</p>
                <p className="text-[15px] font-semibold text-gray-900 truncate">
                  {activeTravel.city}, {activeTravel.country}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Next Travel */}
        {nextTravel && (
          <div className={`p-4 ${activeTravel ? 'bg-gray-50/50' : ''}`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                <Plane size={18} className="text-gray-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-semibold text-gray-900 truncate">
                  {nextTravel.city}, {nextTravel.country}
                </p>
                <p className="text-[12px] text-gray-500">
                  {formatDateRange(nextTravel.arrival_date, nextTravel.departure_date)}
                </p>
              </div>
              {entries.length > 1 && (
                <button 
                  onClick={() => setShowModal(true)}
                  className="text-[12px] font-medium text-gray-500 hover:text-gray-900 flex items-center gap-1 transition-colors whitespace-nowrap"
                >
                  View all
                  <ChevronRight size={14} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Show only current with view all if no next */}
        {!nextTravel && activeTravel && entries.length > 1 && (
          <div className="px-4 pb-4">
            <button 
              onClick={() => setShowModal(true)}
              className="text-[12px] font-medium text-gray-500 hover:text-gray-900 flex items-center gap-1 transition-colors"
            >
              View all travels
              <ChevronRight size={14} />
            </button>
          </div>
        )}

        {/* If only upcoming (not currently traveling) */}
        {!activeTravel && nextTravel && entries.length === 1 && (
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                <Plane size={18} className="text-gray-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Upcoming</p>
                <p className="text-[15px] font-semibold text-gray-900 truncate">
                  {nextTravel.city}, {nextTravel.country}
                </p>
                <p className="text-[12px] text-gray-500">
                  {formatDateRange(nextTravel.arrival_date, nextTravel.departure_date)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Full Travel Schedule Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="text-[17px] font-semibold text-gray-900">Travel Schedule</h3>
              <button 
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              >
                <X size={16} className="text-gray-500" />
              </button>
            </div>

            {/* Travel List */}
            <div className="max-h-[400px] overflow-y-auto">
              {entries.map((travel) => {
                const isPast = new Date(travel.departure_date) < new Date();
                
                return (
                  <div 
                    key={travel.id}
                    className={`flex items-center gap-3 p-4 border-b border-gray-50 last:border-0 ${
                      travel.is_current ? 'bg-red-50/30' : isPast ? 'opacity-50' : ''
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      travel.is_current ? 'bg-red-100' : 'bg-gray-100'
                    }`}>
                      {travel.is_current 
                        ? <MapPin size={16} className="text-red-500" />
                        : <Plane size={16} className="text-gray-500" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold text-gray-900 truncate">
                        {travel.city}, {travel.country}
                      </p>
                      <div className="flex items-center gap-1.5 text-[12px] text-gray-500">
                        <Calendar size={12} />
                        {formatDateRange(travel.arrival_date, travel.departure_date)}
                      </div>
                    </div>
                    {travel.is_current && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-semibold rounded-full uppercase">
                        Now
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
