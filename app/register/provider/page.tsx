"use client";

import { useState, FormEvent, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { uploadImages } from "@/lib/uploadImages";
import TurnstileCaptcha from "@/components/TurnstileCaptcha";
import { SUPPORTED_COUNTRIES, COUNTRY_CITIES } from "@/lib/countries";
import { CATEGORIES } from "@/lib/constants/categories";
import {
  NATIONALITY_OPTIONS,
  ETHNICITY_OPTIONS,
  HAIR_COLOR_OPTIONS,
  HAIR_LENGTH_OPTIONS,
  EYE_COLOR_OPTIONS,
  BODY_BUILD_OPTIONS,
  BRA_SIZE_OPTIONS,
  BUST_TYPE_OPTIONS,
  GROOMING_OPTIONS,
  TATTOO_OPTIONS,
  PIERCING_OPTIONS,
  SMOKER_OPTIONS,
  SERVICE_OPTIONS,
  LANGUAGE_OPTIONS,
  AVAILABLE_FOR_OPTIONS,
} from "@/lib/listingOptions";
import Logo from "@/components/Logo";

const GENDER_OPTIONS = [
  { value: "Woman", label: "Woman" },
  { value: "Man", label: "Man" },
  { value: "Trans", label: "Trans" },
  { value: "Couple", label: "Couple" },
];

const AGE_OPTIONS = Array.from({ length: 53 }, (_, i) => i + 18);

const STEPS = [
  { num: 1, label: "Basic Info" },
  { num: 2, label: "Details & Services" },
  { num: 3, label: "Location & Photos" },
];

// ── Reusable styled components ─────────────────────────────────────────

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder = "Select...",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[] | string[];
  placeholder?: string;
  required?: boolean;
}) {
  const opts =
    typeof options[0] === "string"
      ? (options as string[]).map((o) => ({ value: o, label: o }))
      : (options as { value: string; label: string }[]);
  return (
    <div>
      <label className="block text-[13px] font-medium text-gray-500 uppercase tracking-wide mb-1.5">
        {label}
        {required && <span className="text-red-600 ml-0.5">*</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 border border-gray-200 bg-white text-gray-900 focus:outline-none focus:border-[#DC2626] transition-colors text-[15px]"
        style={{ borderRadius: 0 }}
        required={required}
      >
        <option value="">{placeholder}</option>
        {opts.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required = false,
  minLength,
  note,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
  note?: string;
}) {
  return (
    <div>
      <label className="block text-[13px] font-medium text-gray-500 uppercase tracking-wide mb-1.5">
        {label}
        {required && <span className="text-red-600 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-3 border border-gray-200 bg-white text-gray-900 focus:outline-none focus:border-[#DC2626] transition-colors text-[15px]"
        style={{ borderRadius: 0 }}
        placeholder={placeholder}
        required={required}
        minLength={minLength}
      />
      {note && <p className="text-xs text-gray-400 mt-1">{note}</p>}
    </div>
  );
}

function ChipSelect({
  label,
  options,
  selected,
  onChange,
  required = false,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (v: string[]) => void;
  required?: boolean;
}) {
  const toggle = (opt: string) => {
    if (selected.includes(opt)) {
      onChange(selected.filter((s) => s !== opt));
    } else {
      onChange([...selected, opt]);
    }
  };
  return (
    <div>
      <label className="block text-[13px] font-medium text-gray-500 uppercase tracking-wide mb-2">
        {label}
        {required && <span className="text-red-600 ml-0.5">*</span>}
      </label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = selected.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => toggle(opt)}
              className={`px-3 py-1.5 text-[13px] border transition-all ${
                active
                  ? "bg-[#DC2626] border-[#DC2626] text-white"
                  : "bg-white border-gray-200 text-gray-600 hover:border-gray-400"
              }`}
              style={{ borderRadius: 0 }}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────

export default function RegisterProviderPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submittingText, setSubmittingText] = useState("");

  // Step 1
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [gender, setGender] = useState("");
  const [category, setCategory] = useState("");
  const [age, setAge] = useState("");

  // Step 2
  const [nationality, setNationality] = useState("");
  const [ethnicity, setEthnicity] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [hairColor, setHairColor] = useState("");
  const [hairLength, setHairLength] = useState("");
  const [eyeColor, setEyeColor] = useState("");
  const [bodyBuild, setBodyBuild] = useState("");
  const [bustSize, setBustSize] = useState("");
  const [bustType, setBustType] = useState("");
  const [pubicHair, setPubicHair] = useState("");
  const [tattoos, setTattoos] = useState("");
  const [piercings, setPiercings] = useState("");
  const [smoker, setSmoker] = useState("");
  const [services, setServices] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [about, setAbout] = useState("");

  // Step 3
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [availableFor, setAvailableFor] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [telegram, setTelegram] = useState("");
  const [frontPhotoFile, setFrontPhotoFile] = useState<File | null>(null);
  const [frontPhotoPreview, setFrontPhotoPreview] = useState("");
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const frontPhotoRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  // Cities for selected country
  const selectedCountryObj = SUPPORTED_COUNTRIES.find((c) => c.name === country);
  const cityOptions = selectedCountryObj ? COUNTRY_CITIES[selectedCountryObj.code] || [] : [];

  // ── Photo handlers ───────────────────────────────────────────────────

  const handleFrontPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFrontPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setFrontPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + galleryFiles.length > 15) {
      setError("Maximum 15 gallery photos allowed");
      return;
    }
    const newFiles = [...galleryFiles, ...files];
    setGalleryFiles(newFiles);

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setGalleryPreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeGalleryPhoto = (index: number) => {
    setGalleryFiles((prev) => prev.filter((_, i) => i !== index));
    setGalleryPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Step validation ──────────────────────────────────────────────────

  const validateStep1 = (): string | null => {
    if (!email || !password || !confirmPassword) return "Email and password are required";
    if (password.length < 6) return "Password must be at least 6 characters";
    if (password !== confirmPassword) return "Passwords do not match";
    if (!displayName) return "Display name is required";
    if (!gender) return "Please select who you are";
    if (!category) return "Service category is required";
    if (!age) return "Age is required";
    return null;
  };

  const validateStep2 = (): string | null => {
    if (!about || about.length < 50)
      return "About me must be at least 50 characters";
    return null;
  };

  const validateStep3 = (): string | null => {
    if (!country) return "Country is required";
    if (!city) return "City is required";
    if (!phone) return "Phone number is required";
    if (!frontPhotoFile) return "Front photo is required";
    if (!acceptTerms) return "You must accept the terms and conditions";
    return null;
  };

  // ── Navigation ───────────────────────────────────────────────────────

  const goNext = () => {
    setError("");
    if (step === 1) {
      const err = validateStep1();
      if (err) { setError(err); return; }
    } else if (step === 2) {
      const err = validateStep2();
      if (err) { setError(err); return; }
    }
    setStep((s) => Math.min(s + 1, 3));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goBack = () => {
    setError("");
    setStep((s) => Math.max(s - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ── Submit ───────────────────────────────────────────────────────────

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    // CAPTCHA is optional - allow if not configured
    const hasCaptchaKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

    const err = validateStep3();
    if (err) { setError(err); return; }

    setLoading(true);

    // Verify CAPTCHA server-side if configured
    if (hasCaptchaKey && captchaToken) {
      try {
        const captchaRes = await fetch("/api/auth/verify-captcha", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: captchaToken }),
        });
        const captchaData = await captchaRes.json();
        if (!captchaData.success) {
          setError("Security check failed. Please try again.");
          setCaptchaToken(null);
          setLoading(false);
          return;
        }
      } catch {
        // Continue if captcha API fails (graceful degradation)
      }
    } else if (hasCaptchaKey && !captchaToken) {
      // Only require CAPTCHA if it's configured
      setError("Please complete the security check");
      setLoading(false);
      return;
    }

    try {
      setSubmittingText("Creating your account...");
      const supabase = createClient();

      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { account_type: "provider" },
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Failed to create account");

      // Auto sign-in
      await supabase.auth.signInWithPassword({ email, password });

      // 2. Upload photos
      setSubmittingText("Uploading photos...");
      const photoFiles = [frontPhotoFile!, ...galleryFiles];
      const photoUrls = await uploadImages(photoFiles);
      const profileImage = photoUrls[0];
      const images = photoUrls.slice(1);

      // 3. Create listing
      setSubmittingText("Setting up your profile...");
      const res = await fetch("/api/listings/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: authData.user.id,
          title: displayName,
          display_name: displayName,
          gender,
          category,
          age: parseInt(age),
          nationality: nationality || null,
          ethnicity: ethnicity || null,
          height_cm: height ? parseInt(height) : null,
          weight_kg: weight ? parseInt(weight) : null,
          hair_color: hairColor || null,
          hair_length: hairLength || null,
          eye_color: eyeColor || null,
          body_build: bodyBuild || null,
          bust_size: bustSize || null,
          bust_type: bustType || null,
          pubic_hair: pubicHair || null,
          tattoos: tattoos || null,
          piercings: piercings || null,
          smoker: smoker || null,
          services: services.length ? services : null,
          languages: languages.length ? languages : null,
          about,
          country,
          city,
          location: `${city}, ${country}`,
          available_for: availableFor || null,
          phone,
          whatsapp: whatsapp || null,
          telegram: telegram || null,
          profile_image: profileImage,
          images,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to create listing");

      // 4. Redirect to choose-plan
      router.push(`/choose-plan?from=welcome&uid=${authData.user.id}`);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
      setLoading(false);
      setSubmittingText("");
    }
  };

  // ── Render ───────────────────────────────────────────────────────────

  const showBustFields = gender === "Woman" || gender === "Trans";

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 py-5 flex items-center justify-between">
          <Link href="/">
            <Logo />
          </Link>
          <span className="text-[13px] text-gray-400">
            Already a member?{" "}
            <Link href="/login" className="text-[#DC2626] hover:underline font-medium">
              Sign in
            </Link>
          </span>
        </div>
      </header>

      {/* Progress bar */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            {STEPS.map((s, i) => (
              <div key={s.num} className="flex items-center flex-1">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 flex items-center justify-center text-[13px] font-semibold transition-all ${
                      step >= s.num
                        ? "bg-[#DC2626] text-white"
                        : "bg-gray-100 text-gray-400"
                    }`}
                    style={{ borderRadius: 0 }}
                  >
                    {step > s.num ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="square">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      s.num
                    )}
                  </div>
                  <span
                    className={`text-[13px] font-medium hidden sm:block ${
                      step >= s.num ? "text-gray-900" : "text-gray-400"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="flex-1 mx-4">
                    <div className="h-[2px] bg-gray-100">
                      <div
                        className="h-full bg-[#DC2626] transition-all duration-500"
                        style={{ width: step > s.num ? "100%" : "0%" }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main */}
      <main className="max-w-2xl mx-auto px-4 py-10">
        {/* Error */}
        {error && (
          <div
            className="mb-6 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-[14px]"
            style={{ borderRadius: 0 }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* ── STEP 1: Basic Info ──────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-8 animate-in fade-in">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                  Let&apos;s get started
                </h1>
                <p className="text-[15px] text-gray-500 mt-1">
                  Create your account in under 3 minutes.
                </p>
              </div>

              <div className="bg-white border border-gray-100 p-6 space-y-5">
                <InputField
                  label="Email"
                  value={email}
                  onChange={setEmail}
                  type="email"
                  placeholder="your@email.com"
                  required
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputField
                    label="Password"
                    value={password}
                    onChange={setPassword}
                    type="password"
                    required
                    minLength={6}
                    note="Min. 6 characters"
                  />
                  <InputField
                    label="Confirm Password"
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    type="password"
                    required
                  />
                </div>
              </div>

              <div className="bg-white border border-gray-100 p-6 space-y-5">
                <InputField
                  label="Display Name"
                  value={displayName}
                  onChange={setDisplayName}
                  placeholder="Your stage name or nickname"
                  required
                />

                <div>
                  <label className="block text-[13px] font-medium text-gray-500 uppercase tracking-wide mb-2">
                    Who are you? <span className="text-red-600">*</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {GENDER_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setGender(opt.value)}
                        className={`py-3 text-[14px] font-medium border transition-all ${
                          gender === opt.value
                            ? "bg-[#DC2626] border-[#DC2626] text-white"
                            : "bg-white border-gray-200 text-gray-600 hover:border-gray-400"
                        }`}
                        style={{ borderRadius: 0 }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <SelectField
                  label="Service Category"
                  value={category}
                  onChange={setCategory}
                  options={[...CATEGORIES]}
                  required
                />

                <SelectField
                  label="Age"
                  value={age}
                  onChange={setAge}
                  options={AGE_OPTIONS.map((a) => ({
                    value: String(a),
                    label: String(a),
                  }))}
                  required
                />
              </div>

              <button
                type="button"
                onClick={goNext}
                className="w-full py-4 bg-[#DC2626] text-white font-semibold text-[15px] hover:bg-[#B91C1C] transition-colors"
                style={{ borderRadius: 0 }}
              >
                Continue
              </button>
            </div>
          )}

          {/* ── STEP 2: Details & Services ──────────────────────────── */}
          {step === 2 && (
            <div className="space-y-8 animate-in fade-in">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                  Your details
                </h1>
                <p className="text-[15px] text-gray-500 mt-1">
                  Help clients find exactly what they&apos;re looking for.
                </p>
              </div>

              {/* Appearance */}
              <div className="bg-white border border-gray-100 p-6 space-y-5">
                <h2 className="text-[13px] font-semibold text-gray-400 uppercase tracking-widest">
                  Appearance
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <SelectField
                    label="Nationality"
                    value={nationality}
                    onChange={setNationality}
                    options={NATIONALITY_OPTIONS}
                  />
                  <SelectField
                    label="Ethnicity"
                    value={ethnicity}
                    onChange={setEthnicity}
                    options={ETHNICITY_OPTIONS}
                  />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <InputField
                    label="Height (cm)"
                    value={height}
                    onChange={setHeight}
                    type="number"
                    placeholder="170"
                  />
                  <InputField
                    label="Weight (kg)"
                    value={weight}
                    onChange={setWeight}
                    type="number"
                    placeholder="60"
                  />
                  <SelectField
                    label="Hair Color"
                    value={hairColor}
                    onChange={setHairColor}
                    options={HAIR_COLOR_OPTIONS}
                  />
                  <SelectField
                    label="Hair Length"
                    value={hairLength}
                    onChange={setHairLength}
                    options={HAIR_LENGTH_OPTIONS}
                  />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <SelectField
                    label="Eye Color"
                    value={eyeColor}
                    onChange={setEyeColor}
                    options={EYE_COLOR_OPTIONS}
                  />
                  <SelectField
                    label="Body Build"
                    value={bodyBuild}
                    onChange={setBodyBuild}
                    options={BODY_BUILD_OPTIONS}
                  />
                  <SelectField
                    label="Pubic Hair"
                    value={pubicHair}
                    onChange={setPubicHair}
                    options={GROOMING_OPTIONS}
                  />
                </div>
                {showBustFields && (
                  <div className="grid grid-cols-2 gap-4">
                    <SelectField
                      label="Bust Size"
                      value={bustSize}
                      onChange={setBustSize}
                      options={BRA_SIZE_OPTIONS}
                    />
                    <SelectField
                      label="Bust Type"
                      value={bustType}
                      onChange={setBustType}
                      options={BUST_TYPE_OPTIONS}
                    />
                  </div>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <SelectField
                    label="Tattoos"
                    value={tattoos}
                    onChange={setTattoos}
                    options={TATTOO_OPTIONS}
                  />
                  <SelectField
                    label="Piercings"
                    value={piercings}
                    onChange={setPiercings}
                    options={PIERCING_OPTIONS}
                  />
                  <SelectField
                    label="Smoker"
                    value={smoker}
                    onChange={setSmoker}
                    options={SMOKER_OPTIONS}
                  />
                </div>
              </div>

              {/* Services */}
              <div className="bg-white border border-gray-100 p-6 space-y-5">
                <h2 className="text-[13px] font-semibold text-gray-400 uppercase tracking-widest">
                  Services & Languages
                </h2>
                <ChipSelect
                  label="Services Offered"
                  options={SERVICE_OPTIONS}
                  selected={services}
                  onChange={setServices}
                />
                <ChipSelect
                  label="Languages Spoken"
                  options={LANGUAGE_OPTIONS}
                  selected={languages}
                  onChange={setLanguages}
                />
              </div>

              {/* About */}
              <div className="bg-white border border-gray-100 p-6 space-y-3">
                <label className="block text-[13px] font-medium text-gray-500 uppercase tracking-wide">
                  About Me <span className="text-red-600">*</span>
                </label>
                <textarea
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 bg-white text-gray-900 focus:outline-none focus:border-[#DC2626] transition-colors text-[15px] resize-none"
                  style={{ borderRadius: 0 }}
                  rows={5}
                  placeholder="Tell clients about yourself, your personality, and what makes you special... (min. 50 characters)"
                  required
                  minLength={50}
                />
                <div className="flex justify-between">
                  <p className="text-xs text-gray-400">Min. 50 characters</p>
                  <p
                    className={`text-xs ${
                      about.length >= 50 ? "text-green-500" : "text-gray-400"
                    }`}
                  >
                    {about.length}/50
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={goBack}
                  className="flex-1 py-4 bg-white border border-gray-200 text-gray-700 font-semibold text-[15px] hover:bg-gray-50 transition-colors"
                  style={{ borderRadius: 0 }}
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  className="flex-[2] py-4 bg-[#DC2626] text-white font-semibold text-[15px] hover:bg-[#B91C1C] transition-colors"
                  style={{ borderRadius: 0 }}
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3: Location, Contact & Photos ──────────────────── */}
          {step === 3 && (
            <div className="space-y-8 animate-in fade-in">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                  Almost there
                </h1>
                <p className="text-[15px] text-gray-500 mt-1">
                  Add your location, contact info, and photos.
                </p>
              </div>

              {/* Location */}
              <div className="bg-white border border-gray-100 p-6 space-y-5">
                <h2 className="text-[13px] font-semibold text-gray-400 uppercase tracking-widest">
                  Location
                </h2>
                <SelectField
                  label="Country"
                  value={country}
                  onChange={(v) => {
                    setCountry(v);
                    setCity("");
                  }}
                  options={SUPPORTED_COUNTRIES.map((c) => ({
                    value: c.name,
                    label: `${c.flag} ${c.name}`,
                  }))}
                  placeholder="Select country..."
                  required
                />
                {cityOptions.length > 0 ? (
                  <div>
                    <label className="block text-[13px] font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                      City <span className="text-red-600">*</span>
                    </label>
                    <select
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 bg-white text-gray-900 focus:outline-none focus:border-[#DC2626] transition-colors text-[15px]"
                      style={{ borderRadius: 0 }}
                      required
                    >
                      <option value="">Select city...</option>
                      {cityOptions.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                      <option value="__other">Other...</option>
                    </select>
                    {city === "__other" && (
                      <input
                        type="text"
                        className="w-full px-4 py-3 mt-2 border border-gray-200 bg-white text-gray-900 focus:outline-none focus:border-[#DC2626] transition-colors text-[15px]"
                        style={{ borderRadius: 0 }}
                        placeholder="Enter city name..."
                        onChange={(e) => setCity(e.target.value)}
                        autoFocus
                      />
                    )}
                  </div>
                ) : (
                  <InputField
                    label="City"
                    value={city}
                    onChange={setCity}
                    placeholder="e.g. Copenhagen"
                    required
                  />
                )}
                <SelectField
                  label="Available For"
                  value={availableFor}
                  onChange={setAvailableFor}
                  options={AVAILABLE_FOR_OPTIONS}
                  placeholder="Incall / Outcall / Both"
                />
              </div>

              {/* Contact */}
              <div className="bg-white border border-gray-100 p-6 space-y-5">
                <h2 className="text-[13px] font-semibold text-gray-400 uppercase tracking-widest">
                  Contact
                </h2>
                <InputField
                  label="Phone (with country code)"
                  value={phone}
                  onChange={setPhone}
                  type="tel"
                  placeholder="+45 12345678"
                  required
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InputField
                    label="WhatsApp"
                    value={whatsapp}
                    onChange={setWhatsapp}
                    placeholder="+45 12345678"
                  />
                  <InputField
                    label="Telegram"
                    value={telegram}
                    onChange={setTelegram}
                    placeholder="@username"
                  />
                </div>
              </div>

              {/* Photos */}
              <div className="bg-white border border-gray-100 p-6 space-y-5">
                <h2 className="text-[13px] font-semibold text-gray-400 uppercase tracking-widest">
                  Photos
                </h2>

                {/* Front photo */}
                <div>
                  <label className="block text-[13px] font-medium text-gray-500 uppercase tracking-wide mb-2">
                    Profile Photo <span className="text-red-600">*</span>
                  </label>
                  <input
                    ref={frontPhotoRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFrontPhotoChange}
                    className="hidden"
                  />
                  {frontPhotoPreview ? (
                    <div className="relative inline-block">
                      <img
                        src={frontPhotoPreview}
                        alt="Profile"
                        className="w-36 h-48 object-cover border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setFrontPhotoFile(null);
                          setFrontPhotoPreview("");
                        }}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-600 text-white flex items-center justify-center text-xs hover:bg-red-700"
                        style={{ borderRadius: 0 }}
                      >
                        x
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => frontPhotoRef.current?.click()}
                      className="w-36 h-48 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-[#DC2626] hover:text-[#DC2626] transition-colors"
                      style={{ borderRadius: 0 }}
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="3" y="3" width="18" height="18" rx="0" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <path d="M21 15l-5-5L5 21" />
                      </svg>
                      <span className="text-[12px] font-medium">Add photo</span>
                    </button>
                  )}
                </div>

                {/* Gallery */}
                <div>
                  <label className="block text-[13px] font-medium text-gray-500 uppercase tracking-wide mb-2">
                    Gallery Photos <span className="text-gray-400 font-normal normal-case">(optional, max 15)</span>
                  </label>
                  <input
                    ref={galleryRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleGalleryChange}
                    className="hidden"
                  />
                  <div className="flex flex-wrap gap-3">
                    {galleryPreviews.map((preview, i) => (
                      <div key={i} className="relative">
                        <img
                          src={preview}
                          alt={`Gallery ${i + 1}`}
                          className="w-24 h-32 object-cover border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => removeGalleryPhoto(i)}
                          className="absolute -top-2 -right-2 w-5 h-5 bg-red-600 text-white flex items-center justify-center text-[10px] hover:bg-red-700"
                          style={{ borderRadius: 0 }}
                        >
                          x
                        </button>
                      </div>
                    ))}
                    {galleryFiles.length < 15 && (
                      <button
                        type="button"
                        onClick={() => galleryRef.current?.click()}
                        className="w-24 h-32 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-[#DC2626] hover:text-[#DC2626] transition-colors"
                        style={{ borderRadius: 0 }}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <line x1="12" y1="5" x2="12" y2="19" />
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        <span className="text-[11px]">Add</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* CAPTCHA */}
              <div className="bg-white border border-gray-100 p-6 flex justify-center">
                <TurnstileCaptcha
                  onVerify={(token) => setCaptchaToken(token)}
                  onError={() => setCaptchaToken(null)}
                  onExpire={() => setCaptchaToken(null)}
                  theme="light"
                />
              </div>

              {/* Terms */}
              <div className="bg-white border border-gray-100 p-6">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acceptTerms}
                    onChange={(e) => setAcceptTerms(e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-[#DC2626]"
                  />
                  <span className="text-[14px] text-gray-600">
                    I confirm I am at least 18 years old and accept the{" "}
                    <Link href="/terms" className="text-[#DC2626] hover:underline">
                      terms and conditions
                    </Link>
                  </span>
                </label>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={goBack}
                  className="flex-1 py-4 bg-white border border-gray-200 text-gray-700 font-semibold text-[15px] hover:bg-gray-50 transition-colors"
                  style={{ borderRadius: 0 }}
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-[2] py-4 bg-[#DC2626] text-white font-semibold text-[15px] hover:bg-[#B91C1C] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  style={{ borderRadius: 0 }}
                >
                  {loading ? submittingText || "Creating..." : "Create my profile"}
                </button>
              </div>

              <p className="text-center text-[13px] text-gray-400">
                Your profile will be reviewed and go live within 24 hours.
              </p>
            </div>
          )}
        </form>
      </main>
    </div>
  );
}
