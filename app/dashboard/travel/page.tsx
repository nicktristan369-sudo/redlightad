"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { createClient } from "@/lib/supabase";
import { ALL_COUNTRIES, codeToEmoji } from "@/lib/countries";

interface TravelEntry {
  id: string;
  listing_id: string;
  country: string;
  city: string;
  country_code: string;
  arrival_date: string;
  departure_date: string;
  is_current: boolean;
}

export default function TravelDashboardPage() {
  const [listingId, setListingId] = useState<string | null>(null);
  const [entries, setEntries] = useState<TravelEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [arrivalDate, setArrivalDate] = useState("");
  const [departureDate, setDepartureDate] = useState("");

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data: listing } = await supabase
        .from("listings")
        .select("id")
        .eq("user_id", user.id)
        .limit(1)
        .single();

      if (!listing) { setLoading(false); return; }
      setListingId(listing.id);

      const res = await fetch(`/api/travel?listing_id=${listing.id}`);
      const d = await res.json();
      if (d.entries) setEntries(d.entries);
      setLoading(false);
    };
    load();
  }, []);

  const handleSubmit = async () => {
    if (!listingId || !country || !city || !arrivalDate || !departureDate) return;
    const selected = ALL_COUNTRIES.find(c => c.name === country);
    if (!selected) return;

    setSaving(true);
    const res = await fetch("/api/travel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        listing_id: listingId,
        country: selected.name,
        city,
        country_code: selected.code,
        arrival_date: arrivalDate,
        departure_date: departureDate,
      }),
    });
    const d = await res.json();
    if (d.entry) {
      setEntries(prev => [...prev, d.entry].sort((a, b) => a.arrival_date.localeCompare(b.arrival_date)));
      setCountry("");
      setCity("");
      setArrivalDate("");
      setDepartureDate("");
      setShowForm(false);
    }
    setSaving(false);
  };

  const handleDelete = async (travelId: string) => {
    await fetch("/api/travel", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ travel_id: travelId }),
    });
    setEntries(prev => prev.filter(e => e.id !== travelId));
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div style={{ padding: 40, textAlign: "center", color: "#999" }}>Loading...</div>
      </DashboardLayout>
    );
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    fontSize: 14,
    border: "1px solid #D1D5DB",
    borderRadius: 0,
    background: "#fff",
    outline: "none",
  };

  return (
    <DashboardLayout>
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16 }}>✈️ Travel Schedule</h1>

        {/* Warning box */}
        <div style={{
          background: "#FEF9C3",
          border: "1px solid #FDE047",
          padding: "14px 16px",
          borderRadius: 0,
          marginBottom: 24,
          display: "flex",
          gap: 10,
          alignItems: "flex-start",
        }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
          <p style={{ fontSize: 13, color: "#854D0E", margin: 0, lineHeight: 1.5 }}>
            When you add a trip, your listing will automatically move to the destination on arrival date. Your listing will no longer be visible in your current country. On departure date you will be moved back automatically.
          </p>
        </div>

        {/* Add trip toggle */}
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            padding: "10px 20px",
            fontSize: 13,
            fontWeight: 600,
            background: "#000",
            color: "#fff",
            border: "none",
            borderRadius: 0,
            cursor: "pointer",
            marginBottom: 20,
          }}
        >
          {showForm ? "Cancel" : "+ Add Trip"}
        </button>

        {/* Add trip form */}
        {showForm && (
          <div style={{
            background: "#fff",
            border: "1px solid #E5E5E5",
            padding: 20,
            marginBottom: 24,
            borderRadius: 0,
          }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>Country</label>
                <select
                  value={country}
                  onChange={e => setCountry(e.target.value)}
                  style={{ ...inputStyle, cursor: "pointer" }}
                >
                  <option value="">Select country...</option>
                  {ALL_COUNTRIES.map(c => (
                    <option key={c.code} value={c.name}>{codeToEmoji(c.code)} {c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>City</label>
                <input
                  type="text"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  placeholder="City name"
                  style={inputStyle}
                />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>Arrival Date</label>
                <input
                  type="date"
                  value={arrivalDate}
                  onChange={e => { setArrivalDate(e.target.value); if (departureDate && e.target.value > departureDate) setDepartureDate(""); }}
                  min={today}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 4 }}>Departure Date</label>
                <input
                  type="date"
                  value={departureDate}
                  onChange={e => setDepartureDate(e.target.value)}
                  min={arrivalDate || today}
                  style={inputStyle}
                />
              </div>
            </div>
            <button
              onClick={handleSubmit}
              disabled={saving || !country || !city || !arrivalDate || !departureDate}
              style={{
                padding: "10px 24px",
                fontSize: 13,
                fontWeight: 600,
                background: saving ? "#999" : "#000",
                color: "#fff",
                border: "none",
                borderRadius: 0,
                cursor: saving ? "not-allowed" : "pointer",
              }}
            >
              {saving ? "Saving..." : "Add Trip"}
            </button>
          </div>
        )}

        {/* Trip list */}
        {entries.length === 0 ? (
          <p style={{ fontSize: 14, color: "#9CA3AF" }}>No trips scheduled yet.</p>
        ) : (
          <div style={{ background: "#fff", border: "1px solid #E5E5E5", borderRadius: 0 }}>
            {entries.map((e, i) => (
              <div
                key={e.id}
                style={{
                  padding: "14px 16px",
                  borderBottom: i < entries.length - 1 ? "1px solid #E5E5E5" : "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>
                    {codeToEmoji(e.country_code)} {e.city}, {e.country}
                  </div>
                  <div style={{ fontSize: 12, color: "#6B7280" }}>
                    {e.arrival_date} → {e.departure_date}
                  </div>
                  {e.is_current && (
                    <span style={{
                      display: "inline-block",
                      marginTop: 4,
                      background: "#DC2626",
                      color: "#fff",
                      fontSize: 10,
                      fontWeight: 600,
                      padding: "2px 8px",
                      borderRadius: 0,
                    }}>
                      ✈️ Current Location
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(e.id)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#DC2626",
                    fontSize: 18,
                    cursor: "pointer",
                    padding: "4px 8px",
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
