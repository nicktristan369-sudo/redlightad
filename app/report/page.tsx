"use client"

import { useState } from "react"
import Navbar from "@/components/Navbar"

export default function ReportPage() {
  const [formData, setFormData] = useState({
    type: "",
    url: "",
    description: "",
    email: "",
  })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    // Simulate submission (in production, this would send to an API)
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setSubmitted(true)
    setLoading(false)
  }

  if (submitted) {
    return (
      <>
        <Navbar />
        <main className="bg-[#F5F5F7] min-h-screen">
          <div className="mx-auto max-w-xl px-4 py-16 text-center">
            <div className="bg-white rounded-xl p-8 shadow-sm">
              <div className="text-5xl mb-4">✅</div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Report Submitted</h1>
              <p className="text-gray-600 mb-6">
                Thank you for your report. Our team will review it within 24 hours and take appropriate action.
              </p>
              <a 
                href="/" 
                className="inline-block bg-red-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
              >
                Back to Home
              </a>
            </div>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <main className="bg-[#F5F5F7] min-h-screen">
        <div className="mx-auto max-w-2xl px-4 py-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Report Abuse</h1>
          <p className="text-gray-600 mb-8">
            Help us keep RedLightAD safe. Report any content or behavior that violates our terms.
          </p>

          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-8">
            <p className="text-red-800 text-sm">
              <strong>🚨 Emergency:</strong> If you believe someone is in immediate danger, please contact local emergency services (112 in EU, 911 in US, 999 in UK).
            </p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow-sm space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type of Report *
              </label>
              <select
                required
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                <option value="">Select a reason...</option>
                <option value="trafficking">Human trafficking or exploitation</option>
                <option value="underage">Underage content (CSAM)</option>
                <option value="fraud">Fraud or scam</option>
                <option value="harassment">Harassment or threats</option>
                <option value="fake">Fake or stolen photos</option>
                <option value="spam">Spam or misleading content</option>
                <option value="other">Other violation</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Profile or Content URL
              </label>
              <input
                type="url"
                placeholder="https://redlightad.com/ads/..."
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Copy the URL of the profile or content you want to report
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                required
                rows={5}
                placeholder="Please provide details about what you are reporting..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Email (optional)
              </label>
              <input
                type="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Provide your email if you'd like to receive updates on your report
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 text-white font-semibold py-3 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Submitting..." : "Submit Report"}
            </button>
          </form>

          <div className="mt-8 bg-white rounded-xl p-6 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-3">What happens next?</h2>
            <ol className="space-y-2 text-sm text-gray-600">
              <li className="flex gap-3">
                <span className="font-semibold text-red-600">1.</span>
                Our Trust & Safety team reviews your report within 24 hours
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-red-600">2.</span>
                If the content violates our terms, we take immediate action
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-red-600">3.</span>
                Serious violations are reported to law enforcement
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-red-600">4.</span>
                If you provided an email, we'll notify you of the outcome
              </li>
            </ol>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              For urgent matters, contact us directly at{" "}
              <a href="mailto:safety@redlightad.com" className="text-red-600 hover:underline">
                safety@redlightad.com
              </a>
            </p>
          </div>
        </div>
      </main>
    </>
  )
}
