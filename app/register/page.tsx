"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { uploadImages } from "@/lib/uploadImages";
import { SUPPORTED_COUNTRIES } from "@/lib/countries";
import { CATEGORIES } from "@/lib/constants/categories";
import Logo from "@/components/Logo";

const GENDER_OPTIONS = [
  { value: "Woman", label: "Woman" },
  { value: "Man", label: "Man" },
  { value: "Trans", label: "Trans" },
  { value: "Couple", label: "Couple" },
];

const AGE_OPTIONS = Array.from({ length: 53 }, (_, i) => i + 18); // 18-70

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Section 1 — Account Details
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Section 2 — Profile Info
  const [displayName, setDisplayName] = useState("");
  const [gender, setGender] = useState("");
  const [category, setCategory] = useState("");
  const [age, setAge] = useState("");
  const [nationality, setNationality] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [about, setAbout] = useState("");

  // Section 3 — Location
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");

  // Section 4 — Contact
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [telegram, setTelegram] = useState("");

  // Section 5 — Photos
  const [frontPhotoFile, setFrontPhotoFile] = useState<File | null>(null);
  const [frontPhotoPreview, setFrontPhotoPreview] = useState("");
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);

  // Section 6 — Terms
  const [acceptTerms, setAcceptTerms] = useState(false);

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
    setGalleryFiles([...galleryFiles, ...files]);
    
    const newPreviews: string[] = [];
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push(reader.result as string);
        if (newPreviews.length === files.length) {
          setGalleryPreviews([...galleryPreviews, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeGalleryPhoto = (index: number) => {
    setGalleryFiles(galleryFiles.filter((_, i) => i !== index));
    setGalleryPreviews(galleryPreviews.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Validation
      if (!email || !password || !confirmPassword) {
        throw new Error("Email and password are required");
      }
      if (password.length < 6) {
        throw new Error("Password must be at least 6 characters");
      }
      if (password !== confirmPassword) {
        throw new Error("Passwords do not match");
      }
      if (!displayName) {
        throw new Error("Display name is required");
      }
      if (!gender) {
        throw new Error("Please select who you are");
      }
      if (!category) {
        throw new Error("Service type is required");
      }
      if (!age) {
        throw new Error("Age is required");
      }
      if (!about || about.length < 50) {
        throw new Error("About me must be at least 50 characters");
      }
      if (!country) {
        throw new Error("Country is required");
      }
      if (!city) {
        throw new Error("City is required");
      }
      if (!phone) {
        throw new Error("Phone number is required");
      }
      if (!frontPhotoFile) {
        throw new Error("Front photo is required");
      }
      if (!acceptTerms) {
        throw new Error("You must accept the terms and conditions");
      }

      const supabase = createClient();

      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/welcome`,
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Failed to create account");

      // 2. Upload photos
      const photoFiles = [frontPhotoFile, ...galleryFiles];
      const photoUrls = await uploadImages(photoFiles);
      const profileImage = photoUrls[0];
      const images = photoUrls.slice(1);

      // 3. Create listing via API (uses service role to bypass RLS for unconfirmed users)
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
          nationality,
          height_cm: height ? parseInt(height) : null,
          weight_kg: weight ? parseInt(weight) : null,
          about,
          country,
          city,
          location: `${city}, ${country}`,
          phone,
          whatsapp: whatsapp || null,
          telegram: telegram || null,
          profile_image: profileImage,
          images,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to create listing");

      // 4. Redirect to welcome page
      router.push("/welcome?new=1");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Logo />
        </div>
      </header>

      {/* Main Form */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Create Your Profile</h1>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700" style={{ borderRadius: 0 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-12">
          {/* Section 1 — Account Details */}
          <section className="pb-8 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Account Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email <span className="text-red-600">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-[#DC2626] transition-colors"
                  style={{ borderRadius: 0 }}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password <span className="text-red-600">*</span>
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-[#DC2626] transition-colors"
                  style={{ borderRadius: 0 }}
                  minLength={6}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password <span className="text-red-600">*</span>
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-[#DC2626] transition-colors"
                  style={{ borderRadius: 0 }}
                  required
                />
              </div>
            </div>
          </section>

          {/* Section 2 — Profile Info */}
          <section className="pb-8 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Profile Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Display Name / Nickname <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-[#DC2626] transition-colors"
                  style={{ borderRadius: 0 }}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  WHO ARE YOU? <span className="text-red-600">*</span>
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-[#DC2626] transition-colors bg-white"
                  style={{ borderRadius: 0 }}
                  required
                >
                  <option value="">Select...</option>
                  {GENDER_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Type / Category <span className="text-red-600">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-[#DC2626] transition-colors bg-white"
                  style={{ borderRadius: 0 }}
                  required
                >
                  <option value="">Select...</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Age <span className="text-red-600">*</span>
                </label>
                <select
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-[#DC2626] transition-colors bg-white"
                  style={{ borderRadius: 0 }}
                  required
                >
                  <option value="">Select...</option>
                  {AGE_OPTIONS.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nationality
                </label>
                <input
                  type="text"
                  value={nationality}
                  onChange={(e) => setNationality(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-[#DC2626] transition-colors"
                  style={{ borderRadius: 0 }}
                  placeholder="e.g. Danish, Thai, Brazilian"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-[#DC2626] transition-colors"
                    style={{ borderRadius: 0 }}
                    placeholder="e.g. 170"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-[#DC2626] transition-colors"
                    style={{ borderRadius: 0 }}
                    placeholder="e.g. 60"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  About Me / Describe Yourself <span className="text-red-600">*</span>
                </label>
                <textarea
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-[#DC2626] transition-colors"
                  style={{ borderRadius: 0 }}
                  rows={6}
                  minLength={50}
                  required
                  placeholder="Tell us about yourself, your services, and what makes you special... (min. 50 characters)"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {about.length} / 50 characters minimum
                </p>
              </div>
            </div>
          </section>

          {/* Section 3 — Location */}
          <section className="pb-8 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Location</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country <span className="text-red-600">*</span>
                </label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-[#DC2626] transition-colors bg-white"
                  style={{ borderRadius: 0 }}
                  required
                >
                  <option value="">Select country...</option>
                  {SUPPORTED_COUNTRIES.map((c) => (
                    <option key={c.code} value={c.name}>
                      {c.flag} {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-[#DC2626] transition-colors"
                  style={{ borderRadius: 0 }}
                  required
                  placeholder="e.g. Copenhagen"
                />
              </div>
            </div>
          </section>

          {/* Section 4 — Contact */}
          <section className="pb-8 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Contact Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone (with country code) <span className="text-red-600">*</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-[#DC2626] transition-colors"
                  style={{ borderRadius: 0 }}
                  required
                  placeholder="e.g. +45 12345678"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  WhatsApp
                </label>
                <input
                  type="text"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-[#DC2626] transition-colors"
                  style={{ borderRadius: 0 }}
                  placeholder="e.g. +45 12345678"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telegram
                </label>
                <input
                  type="text"
                  value={telegram}
                  onChange={(e) => setTelegram(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-[#DC2626] transition-colors"
                  style={{ borderRadius: 0 }}
                  placeholder="e.g. @username"
                />
              </div>
            </div>
          </section>

          {/* Section 5 — Photos */}
          <section className="pb-8 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Photos</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Front Photo <span className="text-red-600">*</span>
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFrontPhotoChange}
                  className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-[#DC2626] transition-colors"
                  style={{ borderRadius: 0 }}
                  required
                />
                {frontPhotoPreview && (
                  <div className="mt-4">
                    <img
                      src={frontPhotoPreview}
                      alt="Front photo preview"
                      className="w-48 h-48 object-cover border border-gray-300"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gallery Photos (optional, max 15)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleGalleryChange}
                  className="w-full px-4 py-3 border border-gray-300 focus:outline-none focus:border-[#DC2626] transition-colors"
                  style={{ borderRadius: 0 }}
                />
                {galleryPreviews.length > 0 && (
                  <div className="mt-4 grid grid-cols-3 md:grid-cols-5 gap-4">
                    {galleryPreviews.map((preview, i) => (
                      <div key={i} className="relative">
                        <img
                          src={preview}
                          alt={`Gallery ${i + 1}`}
                          className="w-full h-32 object-cover border border-gray-300"
                        />
                        <button
                          type="button"
                          onClick={() => removeGalleryPhoto(i)}
                          className="absolute top-1 right-1 bg-red-600 text-white w-6 h-6 flex items-center justify-center text-xs hover:bg-red-700"
                          style={{ borderRadius: 0 }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Section 6 — Terms */}
          <section className="pb-8">
            <div className="space-y-4">
              <label className="flex items-start">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="mt-1 mr-3"
                  required
                />
                <span className="text-sm text-gray-700">
                  I accept the{" "}
                  <Link href="/terms" className="text-[#DC2626] hover:underline">
                    terms and conditions
                  </Link>{" "}
                  <span className="text-red-600">*</span>
                </span>
              </label>
            </div>
          </section>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full px-8 py-4 bg-[#DC2626] text-white font-semibold hover:bg-[#B91C1C] disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              style={{ borderRadius: 0 }}
            >
              {loading ? "Creating your profile..." : "Create my profile →"}
            </button>
          </div>

          <div className="text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link href="/login" className="text-[#DC2626] hover:underline font-medium">
              Sign in
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
