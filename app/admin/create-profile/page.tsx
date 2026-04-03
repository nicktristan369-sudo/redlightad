"use client";

import { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { SUPPORTED_COUNTRIES } from "@/lib/countries";

type ProfileData = {
  display_name: string;
  phone: string;
  email: string;
  description: string;
  city: string;
  country: string;
  age: number | null;
  images: string[];
  source_url: string;
};

type CreateResult = {
  success: boolean;
  userId: string;
  username?: string;
  loginId?: string;
  email: string;
  password: string;
  phone?: string;
  smsStatus: string;
};

export default function CreateProfilePage() {
  const [step, setStep] = useState(1);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [sendSMS, setSendSMS] = useState(true);
  const [profile, setProfile] = useState<ProfileData>({
    display_name: "",
    phone: "",
    email: "",
    description: "",
    city: "",
    country: "Denmark",
    age: null,
    images: [],
    source_url: "",
  });
  const [result, setResult] = useState<CreateResult | null>(null);

  const handleScrape = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/scrape-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (data.profile) {
        setProfile({ ...data.profile, email: "" });
        setStep(2);
      } else {
        setError("Kunne ikke hente profil data");
      }
    } catch {
      setError("Fejl ved hentning af URL");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!profile.display_name.trim()) {
      setError("Navn er påkrævet");
      return;
    }
    setCreating(true);
    setError("");
    try {
      const res = await fetch("/api/admin/create-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile,
          sendSMSNotification: sendSMS,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setResult(data);
        setStep(3);
      } else {
        setError(data.error || "Fejl ved oprettelse");
      }
    } catch {
      setError("Netværksfejl");
    } finally {
      setCreating(false);
    }
  };

  const reset = () => {
    setStep(1);
    setUrl("");
    setProfile({
      display_name: "",
      phone: "",
      email: "",
      description: "",
      city: "",
      country: "Denmark",
      age: null,
      images: [],
      source_url: "",
    });
    setResult(null);
    setError("");
    setSendSMS(true);
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    fontSize: 13,
    border: "1px solid #E5E5E5",
    borderRadius: 8,
    outline: "none",
    background: "#fff",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 600,
    color: "#374151",
    marginBottom: 4,
    display: "block",
  };

  return (
    <AdminLayout>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        <h1 className="text-[22px] font-bold text-gray-900 mb-1">
          Opret profil
        </h1>
        <p className="text-[13px] text-gray-500 mb-6">
          Scrape en annonce og opret bruger automatisk
        </p>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold"
                style={{
                  background: step >= s ? "#000" : "#E5E5E5",
                  color: step >= s ? "#fff" : "#9CA3AF",
                }}
              >
                {s}
              </div>
              {s < 3 && (
                <div
                  style={{
                    width: 32,
                    height: 2,
                    background: step > s ? "#000" : "#E5E5E5",
                    borderRadius: 1,
                  }}
                />
              )}
            </div>
          ))}
          <span className="text-[12px] text-gray-400 ml-2">
            {step === 1 && "Hent info"}
            {step === 2 && "Gennemse"}
            {step === 3 && "Resultat"}
          </span>
        </div>

        {error && (
          <div
            className="text-[13px] px-4 py-3 rounded-lg mb-4"
            style={{ background: "#FEE2E2", color: "#7F1D1D" }}
          >
            {error}
          </div>
        )}

        {/* Step 1 — URL input */}
        {step === 1 && (
          <div
            className="bg-white rounded-xl p-6"
            style={{ border: "1px solid #E5E5E5" }}
          >
            <label style={labelStyle}>Annonce URL</label>
            <div className="flex gap-2">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
                style={inputStyle}
                onKeyDown={(e) => e.key === "Enter" && handleScrape()}
              />
              <button
                onClick={handleScrape}
                disabled={loading || !url.trim()}
                className="px-5 py-2.5 rounded-lg text-[13px] font-semibold whitespace-nowrap"
                style={{
                  background: loading || !url.trim() ? "#E5E5E5" : "#000",
                  color: loading || !url.trim() ? "#9CA3AF" : "#fff",
                  cursor: loading || !url.trim() ? "not-allowed" : "pointer",
                }}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-gray-400 border-t-white rounded-full animate-spin" />
                    Henter...
                  </span>
                ) : (
                  "Hent info"
                )}
              </button>
            </div>
            <p className="text-[11px] text-gray-400 mt-2">
              Indsæt link til en annonce — vi henter navn, telefon, by og
              beskrivelse automatisk
            </p>

            {/* Manual entry option */}
            <div
              className="mt-4 pt-4"
              style={{ borderTop: "1px solid #F3F4F6" }}
            >
              <button
                onClick={() => setStep(2)}
                className="text-[12px] font-medium"
                style={{ color: "#6B7280" }}
              >
                Eller opret manuelt uden URL →
              </button>
            </div>
          </div>
        )}

        {/* Step 2 — Review & edit */}
        {step === 2 && (
          <div
            className="bg-white rounded-xl p-6"
            style={{ border: "1px solid #E5E5E5" }}
          >
            <div className="space-y-4">
              <div>
                <label style={labelStyle}>Navn *</label>
                <input
                  type="text"
                  value={profile.display_name}
                  onChange={(e) =>
                    setProfile({ ...profile, display_name: e.target.value })
                  }
                  style={inputStyle}
                  placeholder="Display name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label style={labelStyle}>Telefon</label>
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) =>
                      setProfile({ ...profile, phone: e.target.value })
                    }
                    style={inputStyle}
                    placeholder="+45 12 34 56 78"
                  />
                </div>
                <div>
                  <label style={labelStyle}>By</label>
                  <input
                    type="text"
                    value={profile.city}
                    onChange={(e) =>
                      setProfile({ ...profile, city: e.target.value })
                    }
                    style={inputStyle}
                    placeholder="København"
                  />
                </div>
                <div>
                  <label style={labelStyle}>Land</label>
                  <select
                    value={profile.country}
                    onChange={(e) => setProfile({ ...profile, country: e.target.value })}
                    style={inputStyle}
                  >
                    {SUPPORTED_COUNTRIES.map(c => (
                      <option key={c.code} value={c.name}>
                        {c.flag} {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label style={labelStyle}>Alder</label>
                  <input
                    type="number"
                    value={profile.age ?? ""}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        age: e.target.value ? parseInt(e.target.value) : null,
                      })
                    }
                    style={inputStyle}
                    placeholder="25"
                  />
                </div>
                <div>
                  <label style={labelStyle}>Email (valgfri)</label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) =>
                      setProfile({ ...profile, email: e.target.value })
                    }
                    style={inputStyle}
                    placeholder="Genereres automatisk hvis tom"
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Beskrivelse</label>
                <textarea
                  value={profile.description}
                  onChange={(e) =>
                    setProfile({ ...profile, description: e.target.value })
                  }
                  rows={4}
                  style={{ ...inputStyle, resize: "vertical" as const }}
                  placeholder="Profiltekst..."
                />
              </div>

              <div>
                <label style={labelStyle}>Kilde URL</label>
                <input
                  type="text"
                  value={profile.source_url}
                  readOnly
                  style={{
                    ...inputStyle,
                    background: "#F9FAFB",
                    color: "#6B7280",
                  }}
                />
              </div>

              {/* Image previews */}
              {profile.images.length > 0 && (
                <div>
                  <label style={labelStyle}>
                    Billeder ({profile.images.length})
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {profile.images.map((src, i) => (
                      <img
                        key={i}
                        src={src}
                        alt=""
                        className="rounded-lg object-cover"
                        style={{
                          width: 80,
                          height: 80,
                          border: "1px solid #E5E5E5",
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* SMS toggle */}
              <div
                className="flex items-center justify-between pt-4"
                style={{ borderTop: "1px solid #F3F4F6" }}
              >
                <div>
                  <p className="text-[13px] font-semibold text-gray-900">
                    Send SMS med login info
                  </p>
                  <p className="text-[11px] text-gray-400">
                    Sender email, kode og GRATIS30 promo til brugerens telefon
                  </p>
                </div>
                <button
                  onClick={() => setSendSMS(!sendSMS)}
                  className="relative w-10 h-5 rounded-full transition-colors"
                  style={{ background: sendSMS ? "#000" : "#D1D5DB" }}
                >
                  <span
                    className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform"
                    style={{
                      left: 2,
                      transform: sendSMS
                        ? "translateX(20px)"
                        : "translateX(0)",
                    }}
                  />
                </button>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2.5 rounded-lg text-[13px] font-medium"
                style={{ border: "1px solid #E5E5E5", color: "#6B7280" }}
              >
                Tilbage
              </button>
              <button
                onClick={handleCreate}
                disabled={creating}
                className="flex-1 px-4 py-2.5 rounded-lg text-[13px] font-semibold"
                style={{
                  background: creating ? "#E5E5E5" : "#000",
                  color: creating ? "#9CA3AF" : "#fff",
                  cursor: creating ? "not-allowed" : "pointer",
                }}
              >
                {creating ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-gray-400 border-t-white rounded-full animate-spin" />
                    Opretter...
                  </span>
                ) : (
                  "Opret profil"
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — Result */}
        {step === 3 && result && (
          <div
            className="bg-white rounded-xl p-6"
            style={{ border: "1px solid #E5E5E5" }}
          >
            <div
              className="flex items-center gap-3 mb-5 pb-5"
              style={{ borderBottom: "1px solid #F3F4F6" }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-[18px]"
                style={{ background: "#DCFCE7" }}
              >
                ✓
              </div>
              <div>
                <p className="text-[15px] font-bold text-gray-900">
                  Profil oprettet
                </p>
                <p className="text-[12px] text-gray-400">
                  Bruger er klar til at logge ind
                </p>
              </div>
            </div>

            <div className="space-y-2 mb-5">
              {[
                { label: "Login ID", value: result.loginId || result.email },
                { label: "Email", value: result.email },
                { label: "Adgangskode", value: result.password },
                { label: "SMS", value: result.smsStatus === "sent" ? "Sendt" : "Ikke sendt" },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between py-2 px-3 rounded-lg"
                  style={{ background: "#F9FAFB" }}
                >
                  <span className="text-[12px] font-semibold text-gray-500 w-28">{row.label}</span>
                  <span className="text-[13px] font-mono text-gray-900 flex-1 text-right pr-2 truncate">{row.value}</span>
                  <button
                    onClick={() => navigator.clipboard.writeText(row.value)}
                    className="text-[11px] px-2 py-1 rounded border border-gray-200 text-gray-500 hover:bg-gray-100 flex-shrink-0"
                  >
                    Kopi
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                const text = `Login info:\nEmail: ${result.email}\nKode: ${result.password}`
                navigator.clipboard.writeText(text)
              }}
              className="w-full mb-3 px-4 py-2.5 rounded-lg text-[13px] font-semibold border border-gray-200"
              style={{ background: "#F9FAFB", color: "#111" }}
            >
              Kopiér alle login info
            </button>

            <button
              onClick={reset}
              className="w-full px-4 py-2.5 rounded-lg text-[13px] font-semibold"
              style={{ background: "#000", color: "#fff" }}
            >
              Opret ny profil
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
