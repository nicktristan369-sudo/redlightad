"use client"

import { useEffect, useState, useRef } from "react"
import DashboardLayout from "@/components/DashboardLayout"
import { createClient } from "@/lib/supabase"
import { Shield, CheckCircle, AlertCircle, Camera, CreditCard, User, ChevronRight, Upload, X, Clock, FileCheck } from "lucide-react"

interface KycSubmission {
  id: string
  status: string
  rejection_reason: string | null
  reviewed_at: string | null
  submitted_at: string
}

const COUNTRIES = [
  "Denmark", "Sweden", "Norway", "Finland", "Germany", "Netherlands",
  "Belgium", "France", "Spain", "Italy", "United Kingdom", "Ireland",
  "Poland", "Czech Republic", "Austria", "Switzerland", "Portugal",
  "Thailand", "Philippines", "Colombia", "Brazil", "United States", "Other",
]

const ID_TYPES = [
  { value: "passport", label: "Passport", icon: "🛂", needsBack: false },
  { value: "drivers_license", label: "Driver's License", icon: "🚗", needsBack: true },
  { value: "national_id", label: "National ID Card", icon: "🪪", needsBack: true },
]

export default function VerifyPage() {
  const [step, setStep] = useState(0) // 0 = intro, 1-3 = form steps
  const [existing, setExisting] = useState<KycSubmission | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [listingId, setListingId] = useState<string | null>(null)

  // Form fields
  const [fullName, setFullName] = useState("")
  const [dob, setDob] = useState("")
  const [country, setCountry] = useState("Denmark")
  const [idType, setIdType] = useState("passport")
  const [idFrontUrl, setIdFrontUrl] = useState("")
  const [idFrontPreview, setIdFrontPreview] = useState("")
  const [idBackUrl, setIdBackUrl] = useState("")
  const [idBackPreview, setIdBackPreview] = useState("")
  const [selfieUrl, setSelfieUrl] = useState("")
  const [selfiePreview, setSelfiePreview] = useState("")
  const [uploadingFront, setUploadingFront] = useState(false)
  const [uploadingBack, setUploadingBack] = useState(false)
  const [uploadingSelfie, setUploadingSelfie] = useState(false)

  const frontInputRef = useRef<HTMLInputElement>(null)
  const backInputRef = useRef<HTMLInputElement>(null)
  const selfieInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const load = async () => {
      fetch("/api/kyc")
        .then((r) => r.json())
        .then((d) => { if (d && d.id) setExisting(d) })
        .catch(() => {})
        .finally(() => setLoading(false))

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: listing } = await supabase
          .from("listings")
          .select("id")
          .eq("user_id", user.id)
          .limit(1)
          .single()
        if (listing) setListingId(listing.id)
      }
    }
    load()
  }, [])

  async function uploadToCloudinary(file: File): Promise<string | null> {
    const fd = new FormData()
    fd.append("file", file)
    fd.append("upload_preset", "redlightad_unsigned")
    try {
      const res = await fetch("https://api.cloudinary.com/v1_1/drxpitjyw/image/upload", {
        method: "POST",
        body: fd,
      })
      const json = await res.json()
      return json.secure_url || null
    } catch {
      return null
    }
  }

  async function handleUpload(
    file: File,
    setUrl: (url: string) => void,
    setPreview: (url: string) => void,
    setUploading: (b: boolean) => void
  ) {
    setUploading(true)
    // Create local preview
    const reader = new FileReader()
    reader.onloadend = () => setPreview(reader.result as string)
    reader.readAsDataURL(file)
    
    const url = await uploadToCloudinary(file)
    if (url) setUrl(url)
    setUploading(false)
  }

  async function handleSubmit() {
    if (!listingId) { alert("No listing found. Please create a listing first."); return }
    setSubmitting(true)
    try {
      const res = await fetch("/api/kyc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          date_of_birth: dob,
          country,
          id_type: idType,
          id_front_url: idFrontUrl,
          id_back_url: idBackUrl || null,
          selfie_url: selfieUrl,
          listing_id: listingId,
        }),
      })
      const json = await res.json()
      if (json.ok) {
        setExisting({ id: "new", status: "pending", rejection_reason: null, reviewed_at: null, submitted_at: new Date().toISOString() })
      } else {
        alert(json.error || "Failed to submit")
      }
    } catch {
      alert("Failed to submit verification")
    } finally {
      setSubmitting(false)
    }
  }

  function handleResubmit() {
    setExisting(null)
    setStep(0)
    setFullName("")
    setDob("")
    setCountry("Denmark")
    setIdType("passport")
    setIdFrontUrl("")
    setIdFrontPreview("")
    setIdBackUrl("")
    setIdBackPreview("")
    setSelfieUrl("")
    setSelfiePreview("")
  }

  const maxDob = new Date(new Date().getFullYear() - 18, new Date().getMonth(), new Date().getDate()).toISOString().split("T")[0]
  const selectedIdType = ID_TYPES.find(t => t.value === idType)
  const needsBack = selectedIdType?.needsBack || false

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-gray-200 border-t-red-600 rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  // Already verified
  if (existing?.status === "approved") {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-8 py-10 text-center">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Identity Verified</h1>
              <p className="text-green-100">Your account is fully verified</p>
            </div>
            
            <div className="p-8">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                <Shield className="w-5 h-5 text-green-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-green-800">Verified Badge Active</p>
                  <p className="text-xs text-green-600">
                    {existing.reviewed_at ? `Verified on ${new Date(existing.reviewed_at).toLocaleDateString()}` : "Your verified badge is now visible on your profile"}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-gray-900">✓</p>
                  <p className="text-xs text-gray-500 mt-1">ID Verified</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-gray-900">✓</p>
                  <p className="text-xs text-gray-500 mt-1">Face Match</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // Pending review
  if (existing?.status === "pending") {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-8 py-10 text-center">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Verification In Progress</h1>
              <p className="text-blue-100">We're reviewing your documents</p>
            </div>
            
            <div className="p-8">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <span className="font-semibold">Submitted:</span> {new Date(existing.submitted_at).toLocaleDateString()} at {new Date(existing.submitted_at).toLocaleTimeString()}
                </p>
                <p className="text-sm text-blue-700 mt-2">
                  Your verification is being reviewed by our team. This typically takes 24-48 hours.
                </p>
              </div>

              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-gray-700">Documents uploaded</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-gray-700">Selfie submitted</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-5 h-5 border-2 border-blue-400 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                  </div>
                  <span className="text-gray-700">Manual review in progress</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // Rejected
  if (existing?.status === "rejected") {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-500 to-rose-600 px-8 py-10 text-center">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Verification Not Approved</h1>
              <p className="text-red-100">Please review and resubmit</p>
            </div>
            
            <div className="p-8">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-sm font-semibold text-red-800 mb-1">Reason:</p>
                <p className="text-sm text-red-700">{existing.rejection_reason || "Documents did not meet our requirements"}</p>
              </div>

              <p className="text-sm text-gray-600 mb-6">
                Don't worry! You can submit new documents. Make sure your photos are clear and your face is visible.
              </p>

              <button
                onClick={handleResubmit}
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // Main verification flow
  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        
        {/* Intro screen */}
        {step === 0 && (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-8 py-10 text-center">
              <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Verify Your Identity</h1>
              <p className="text-gray-300">Complete verification to unlock all features</p>
            </div>

            <div className="p-8">
              {/* Benefits */}
              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Verified Badge</h3>
                    <p className="text-sm text-gray-500">Show clients you're real and trustworthy</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Receive Payments</h3>
                    <p className="text-sm text-gray-500">Unlock payouts and sell exclusive content</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <FileCheck className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Higher Ranking</h3>
                    <p className="text-sm text-gray-500">Verified profiles appear higher in search</p>
                  </div>
                </div>
              </div>

              {/* What you need */}
              <div className="bg-gray-50 rounded-lg p-5 mb-8">
                <h3 className="font-semibold text-gray-900 mb-3">What you'll need:</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-xs font-bold text-gray-700 border">1</span>
                    <span>A valid government-issued ID (passport, driver's license, or national ID)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-xs font-bold text-gray-700 border">2</span>
                    <span>A clear selfie of your face</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setStep(1)}
                className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                Get Started
                <ChevronRight className="w-5 h-5" />
              </button>

              <p className="text-xs text-gray-400 text-center mt-4">
                Your data is encrypted and securely stored. We never share your personal information.
              </p>
            </div>
          </div>
        )}

        {/* Step 1: Personal Info */}
        {step === 1 && (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            {/* Progress */}
            <div className="bg-gray-50 px-8 py-4 border-b flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Step 1 of 3</span>
              <div className="flex gap-1">
                <div className="w-8 h-1 bg-red-600 rounded-full" />
                <div className="w-8 h-1 bg-gray-200 rounded-full" />
                <div className="w-8 h-1 bg-gray-200 rounded-full" />
              </div>
            </div>

            <div className="p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-1">Personal Information</h2>
              <p className="text-sm text-gray-500 mb-6">Enter your details exactly as they appear on your ID</p>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Legal Name *</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="As shown on your ID"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth *</label>
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    max={maxDob}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-red-500 transition-colors"
                  />
                  <p className="text-xs text-gray-400 mt-1">You must be at least 18 years old</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Country of Residence *</label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-red-500 transition-colors appearance-none bg-white"
                  >
                    {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setStep(0)}
                  className="flex-1 py-3 border border-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(2)}
                  disabled={!fullName || !dob}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold rounded-lg transition-colors"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: ID Document */}
        {step === 2 && (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            {/* Progress */}
            <div className="bg-gray-50 px-8 py-4 border-b flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Step 2 of 3</span>
              <div className="flex gap-1">
                <div className="w-8 h-1 bg-red-600 rounded-full" />
                <div className="w-8 h-1 bg-red-600 rounded-full" />
                <div className="w-8 h-1 bg-gray-200 rounded-full" />
              </div>
            </div>

            <div className="p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-1">Upload ID Document</h2>
              <p className="text-sm text-gray-500 mb-6">Choose your document type and upload clear photos</p>

              {/* ID Type Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">Document Type</label>
                <div className="grid grid-cols-3 gap-3">
                  {ID_TYPES.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => { setIdType(type.value); setIdBackUrl(""); setIdBackPreview(""); }}
                      className={`p-4 rounded-lg border-2 transition-all text-center ${
                        idType === type.value 
                          ? "border-red-500 bg-red-50" 
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <span className="text-2xl block mb-1">{type.icon}</span>
                      <span className="text-xs font-medium text-gray-700">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Front of ID */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Front of ID *</label>
                <input
                  ref={frontInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleUpload(file, setIdFrontUrl, setIdFrontPreview, setUploadingFront)
                  }}
                />
                {idFrontPreview ? (
                  <div className="relative">
                    <img src={idFrontPreview} alt="ID Front" className="w-full h-48 object-cover rounded-lg border" />
                    <button
                      onClick={() => { setIdFrontUrl(""); setIdFrontPreview(""); }}
                      className="absolute top-2 right-2 w-8 h-8 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black/80"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    {uploadingFront && (
                      <div className="absolute inset-0 bg-white/80 rounded-lg flex items-center justify-center">
                        <div className="w-8 h-8 border-2 border-gray-200 border-t-red-600 rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => frontInputRef.current?.click()}
                    className="w-full h-48 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-red-400 hover:bg-red-50/50 transition-colors"
                  >
                    <Upload className="w-8 h-8 text-gray-400" />
                    <span className="text-sm text-gray-500">Click to upload front of ID</span>
                  </button>
                )}
              </div>

              {/* Back of ID (if needed) */}
              {needsBack && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Back of ID (optional)</label>
                  <input
                    ref={backInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleUpload(file, setIdBackUrl, setIdBackPreview, setUploadingBack)
                    }}
                  />
                  {idBackPreview ? (
                    <div className="relative">
                      <img src={idBackPreview} alt="ID Back" className="w-full h-32 object-cover rounded-lg border" />
                      <button
                        onClick={() => { setIdBackUrl(""); setIdBackPreview(""); }}
                        className="absolute top-2 right-2 w-8 h-8 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black/80"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => backInputRef.current?.click()}
                      className="w-full h-32 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-red-400 hover:bg-red-50/50 transition-colors"
                    >
                      <Upload className="w-6 h-6 text-gray-400" />
                      <span className="text-xs text-gray-500">Click to upload back of ID</span>
                    </button>
                  )}
                </div>
              )}

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
                <strong>Tips:</strong> Make sure the entire document is visible, all text is readable, and the photo is not blurry.
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 border border-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!idFrontUrl}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold rounded-lg transition-colors"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Selfie */}
        {step === 3 && (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            {/* Progress */}
            <div className="bg-gray-50 px-8 py-4 border-b flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">Step 3 of 3</span>
              <div className="flex gap-1">
                <div className="w-8 h-1 bg-red-600 rounded-full" />
                <div className="w-8 h-1 bg-red-600 rounded-full" />
                <div className="w-8 h-1 bg-red-600 rounded-full" />
              </div>
            </div>

            <div className="p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-1">Take a Selfie</h2>
              <p className="text-sm text-gray-500 mb-6">We'll match your face to your ID photo</p>

              {/* Selfie Upload */}
              <div className="mb-6">
                <input
                  ref={selfieInputRef}
                  type="file"
                  accept="image/*"
                  capture="user"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleUpload(file, setSelfieUrl, setSelfiePreview, setUploadingSelfie)
                  }}
                />
                {selfiePreview ? (
                  <div className="relative">
                    <img src={selfiePreview} alt="Selfie" className="w-full h-64 object-cover rounded-lg border" />
                    <button
                      onClick={() => { setSelfieUrl(""); setSelfiePreview(""); }}
                      className="absolute top-2 right-2 w-8 h-8 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black/80"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    {uploadingSelfie && (
                      <div className="absolute inset-0 bg-white/80 rounded-lg flex items-center justify-center">
                        <div className="w-8 h-8 border-2 border-gray-200 border-t-red-600 rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => selfieInputRef.current?.click()}
                    className="w-full h-64 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center gap-3 hover:border-red-400 hover:bg-red-50/50 transition-colors"
                  >
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
                      <Camera className="w-10 h-10 text-gray-400" />
                    </div>
                    <span className="text-sm text-gray-500">Click to take or upload a selfie</span>
                  </button>
                )}
              </div>

              {/* Instructions */}
              <div className="bg-gray-50 rounded-lg p-5 mb-6">
                <h4 className="font-semibold text-gray-900 mb-3">Selfie Requirements:</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span>Face the camera directly</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span>Good lighting, no shadows on face</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span>Remove glasses and hats</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span>Neutral expression</span>
                  </li>
                </ul>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 py-3 border border-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!selfieUrl || submitting}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit for Verification"
                  )}
                </button>
              </div>

              <p className="text-xs text-gray-400 text-center mt-4">
                By submitting, you confirm you are at least 18 years old and agree to our verification terms.
              </p>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
