"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";

const SERVICE_OPTIONS = [
  "Dinner dates",
  "Social events",
  "Travel companion",
  "Private meetings",
  "Weekend getaways",
];

const LANGUAGE_OPTIONS = ["Dansk", "Engelsk", "Tysk", "Fransk", "Spansk"];

export default function OpretAnnoncePage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [form, setForm] = useState({
    title: "",
    category: "",
    gender: "",
    age: "",
    location: "",
    about: "",
    services: [] as string[],
    languages: [] as string[],
    rate_1hour: "",
    rate_2hours: "",
    rate_overnight: "",
    rate_weekend: "",
    phone: "",
    whatsapp: "",
    telegram: "",
    snapchat: "",
    email: "",
  });

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleArray = (field: "services" | "languages", value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((v) => v !== value)
        : [...prev[field], value],
    }));
  };

  const validateStep1 = () => {
    if (!form.title || !form.category || !form.gender || !form.age || !form.location) {
      setError("Udfyld venligst alle felter.");
      return false;
    }
    if (parseInt(form.age) < 18) {
      setError("Du skal være mindst 18 år.");
      return false;
    }
    setError("");
    return true;
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Du skal være logget ind for at oprette en annonce");

      // Upload images
      let imageUrls: string[] = [];
      if (imageFiles.length > 0) {
        const { uploadImages } = await import("@/lib/uploadImages");
        imageUrls = await uploadImages(imageFiles);
      }

      const { error } = await supabase.from("listings").insert({
        user_id: user.id,
        title: form.title,
        category: form.category,
        gender: form.gender,
        age: parseInt(form.age),
        location: form.location,
        about: form.about,
        services: form.services,
        languages: form.languages,
        rate_1hour: form.rate_1hour,
        rate_2hours: form.rate_2hours,
        rate_overnight: form.rate_overnight,
        rate_weekend: form.rate_weekend,
        phone: form.phone,
        whatsapp: form.whatsapp,
        telegram: form.telegram,
        snapchat: form.snapchat,
        email: form.email,
        images: imageUrls,
        profile_image: imageUrls[0] || null,
        status: "draft",
      });
      if (error) throw error;
      setSuccess(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Noget gik galt. Prøv igen.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      title: "",
      category: "",
      gender: "",
      age: "",
      location: "",
      about: "",
      services: [],
      languages: [],
      rate_1hour: "",
      rate_2hours: "",
      rate_overnight: "",
      rate_weekend: "",
      phone: "",
      whatsapp: "",
      telegram: "",
      snapchat: "",
      email: "",
    });
    setImageFiles([]);
    setImagePreviews([]);
    setStep(1);
    setSuccess(false);
    setError("");
  };

  const steps = [
    { num: 1, label: "Basis info" },
    { num: 2, label: "Detaljer" },
    { num: 3, label: "Kontakt & Billeder" },
  ];

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 py-10">
        <div className="mx-auto max-w-2xl px-4">
          <div className="rounded-2xl bg-white p-8 text-center shadow-md">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="mb-2 text-2xl font-bold text-gray-900">Din annonce er oprettet!</h2>
            <p className="mb-6 text-gray-500">
              Din annonce er gemt som kladde og vil blive gennemgået inden udgivelse.
            </p>
            <div className="flex gap-3">
              <a
                href="/mine-annoncer"
                className="flex-1 rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Se mine annoncer
              </a>
              <button
                onClick={resetForm}
                className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700"
              >
                Opret ny annonce
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="mx-auto max-w-2xl px-4">
        {/* Progress Bar */}
        <div className="mb-8 flex items-center justify-center">
          {steps.map((s, i) => (
            <div key={s.num} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${
                    step > s.num
                      ? "bg-red-100 text-red-600"
                      : step === s.num
                        ? "bg-red-600 text-white"
                        : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {step > s.num ? (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    s.num
                  )}
                </div>
                <span className="mt-1 text-xs text-gray-500">{s.label}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={`mx-3 mb-5 h-0.5 w-16 ${step > s.num ? "bg-red-300" : "bg-gray-200"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Form Card */}
        <div className="rounded-2xl bg-white p-8 shadow-md">
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
          )}

          {/* STEP 1 */}
          {step === 1 && (
            <div>
              <h2 className="mb-6 text-xl font-bold text-gray-900">Trin 1: Basis information</h2>

              <div className="space-y-5">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Annonce titel</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => updateField("title", e.target.value)}
                    placeholder="F.eks. Sofia - Diskret escort i København"
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Kategori</label>
                  <select
                    value={form.category}
                    onChange={(e) => updateField("category", e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                  >
                    <option value="" disabled>
                      Vælg kategori
                    </option>
                    <option value="Escort">Escort</option>
                    <option value="Massage">Massage</option>
                    <option value="Fetish">Fetish</option>
                    <option value="Transgender">Transgender</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Køn</label>
                  <div className="flex gap-3">
                    {["Female", "Male", "Transgender"].map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => updateField("gender", g)}
                        className={`rounded-full border px-6 py-2 text-sm font-medium transition ${
                          form.gender === g
                            ? "border-red-600 bg-red-600 text-white"
                            : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Alder</label>
                  <input
                    type="number"
                    min={18}
                    max={99}
                    value={form.age}
                    onChange={(e) => updateField("age", e.target.value)}
                    placeholder="18"
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">By / Lokation</label>
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) => updateField("location", e.target.value)}
                    placeholder="F.eks. København"
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                </div>
              </div>

              <button
                onClick={() => validateStep1() && setStep(2)}
                className="mt-6 w-full rounded-xl bg-red-600 py-2.5 text-sm font-medium text-white hover:bg-red-700"
              >
                Fortsæt →
              </button>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div>
              <h2 className="mb-6 text-xl font-bold text-gray-900">Trin 2: Om dig og dine services</h2>

              <div className="space-y-5">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Om mig</label>
                  <textarea
                    rows={5}
                    value={form.about}
                    onChange={(e) => updateField("about", e.target.value)}
                    placeholder="Beskriv dig selv og hvad du tilbyder..."
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Services</label>
                  <div className="flex flex-wrap gap-2">
                    {SERVICE_OPTIONS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => toggleArray("services", s)}
                        className={`rounded-full border px-4 py-1.5 text-sm transition ${
                          form.services.includes(s)
                            ? "border-red-300 bg-red-100 text-red-700"
                            : "border-gray-300 bg-white text-gray-600 hover:border-gray-400"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Sprog</label>
                  <div className="flex flex-wrap gap-2">
                    {LANGUAGE_OPTIONS.map((l) => (
                      <button
                        key={l}
                        type="button"
                        onClick={() => toggleArray("languages", l)}
                        className={`rounded-full border px-4 py-1.5 text-sm transition ${
                          form.languages.includes(l)
                            ? "border-red-300 bg-red-100 text-red-700"
                            : "border-gray-300 bg-white text-gray-600 hover:border-gray-400"
                        }`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Priser</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="mb-1 block text-xs text-gray-500">1 time</span>
                      <input
                        type="text"
                        value={form.rate_1hour}
                        onChange={(e) => updateField("rate_1hour", e.target.value)}
                        placeholder="500 DKK"
                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                      />
                    </div>
                    <div>
                      <span className="mb-1 block text-xs text-gray-500">2 timer</span>
                      <input
                        type="text"
                        value={form.rate_2hours}
                        onChange={(e) => updateField("rate_2hours", e.target.value)}
                        placeholder="900 DKK"
                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                      />
                    </div>
                    <div>
                      <span className="mb-1 block text-xs text-gray-500">Overnat</span>
                      <input
                        type="text"
                        value={form.rate_overnight}
                        onChange={(e) => updateField("rate_overnight", e.target.value)}
                        placeholder="2.500 DKK"
                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                      />
                    </div>
                    <div>
                      <span className="mb-1 block text-xs text-gray-500">Weekend</span>
                      <input
                        type="text"
                        value={form.rate_weekend}
                        onChange={(e) => updateField("rate_weekend", e.target.value)}
                        placeholder="5.000 DKK"
                        className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 rounded-xl border border-gray-300 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  ← Tilbage
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-medium text-white hover:bg-red-700"
                >
                  Fortsæt →
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div>
              <h2 className="mb-6 text-xl font-bold text-gray-900">Trin 3: Kontakt & billeder</h2>

              <div className="space-y-5">
                {/* Contact fields */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Kontakt</label>
                  <div className="space-y-3">
                    {[
                      { icon: "📞", label: "Telefon", field: "phone" },
                      { icon: "💬", label: "WhatsApp", field: "whatsapp" },
                      { icon: "✈️", label: "Telegram", field: "telegram" },
                      { icon: "👻", label: "Snapchat", field: "snapchat" },
                      { icon: "📧", label: "Email", field: "email" },
                    ].map((c) => (
                      <div key={c.field} className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-2.5">
                        <span className="text-lg">{c.icon}</span>
                        <span className="w-20 text-sm text-gray-500">{c.label}</span>
                        <input
                          type={c.field === "email" ? "email" : "text"}
                          value={form[c.field as keyof typeof form] as string}
                          onChange={(e) => updateField(c.field, e.target.value)}
                          placeholder={c.label}
                          className="flex-1 border-0 bg-transparent text-sm focus:outline-none focus:ring-0"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Image upload area */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Billeder <span className="text-gray-400">(max 20 &bull; JPG, PNG &bull; max 5MB/stk)</span>
                  </label>

                  {/* Drop zone */}
                  <div
                    className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-red-400 transition-colors"
                    onClick={() => document.getElementById("image-input")?.click()}
                  >
                    <div className="text-4xl mb-2">📷</div>
                    <p className="text-gray-500 text-sm font-medium">Klik for at uploade billeder</p>
                    <p className="text-xs text-gray-400 mt-1">Første billede bruges som profilbillede</p>
                    <input
                      id="image-input"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        const remaining = 20 - imageFiles.length;
                        const newFiles = files.slice(0, remaining);
                        setImageFiles(prev => [...prev, ...newFiles]);
                        newFiles.forEach(file => {
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            setImagePreviews(prev => [...prev, ev.target?.result as string]);
                          };
                          reader.readAsDataURL(file);
                        });
                      }}
                    />
                  </div>

                  {/* Preview thumbnails */}
                  {imagePreviews.length > 0 && (
                    <div className="grid grid-cols-4 gap-3 mt-4">
                      {imagePreviews.map((src, i) => (
                        <div key={i} className="relative group aspect-square">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={src}
                            alt={`preview ${i + 1}`}
                            className="w-full h-full object-cover rounded-xl"
                          />
                          {i === 0 && (
                            <span className="absolute top-1 left-1 bg-red-600 text-white text-xs px-1.5 py-0.5 rounded-md font-medium">
                              Profil
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setImageFiles(prev => prev.filter((_, idx) => idx !== i));
                              setImagePreviews(prev => prev.filter((_, idx) => idx !== i));
                            }}
                            className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {imageFiles.length > 0 && (
                    <p className="text-xs text-gray-500 mt-2">{imageFiles.length} billede{imageFiles.length !== 1 ? "r" : ""} valgt</p>
                  )}
                </div>

                {/* Preview */}
                <div className="rounded-xl bg-gray-50 p-5">
                  <div className="mb-3 flex items-center gap-2">
                    <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-700">Forhåndsvisning</span>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p><span className="font-medium">Titel:</span> {form.title || "–"}</p>
                    <p><span className="font-medium">Kategori:</span> {form.category || "–"}</p>
                    <p><span className="font-medium">Køn:</span> {form.gender || "–"}</p>
                    <p><span className="font-medium">Alder:</span> {form.age || "–"}</p>
                    <p><span className="font-medium">Lokation:</span> {form.location || "–"}</p>
                    {form.about && (
                      <p>
                        <span className="font-medium">Om mig:</span>{" "}
                        {form.about.length > 100 ? form.about.slice(0, 100) + "..." : form.about}
                      </p>
                    )}
                    {form.services.length > 0 && (
                      <p><span className="font-medium">Services:</span> {form.services.length} valgt</p>
                    )}
                    {(form.rate_1hour || form.rate_2hours || form.rate_overnight || form.rate_weekend) && (
                      <p>
                        <span className="font-medium">Priser:</span>{" "}
                        {[form.rate_1hour, form.rate_2hours, form.rate_overnight, form.rate_weekend]
                          .filter(Boolean)
                          .join(" / ")}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="rounded-xl border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  ← Tilbage
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {loading && (
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  )}
                  Udgiv annonce
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
