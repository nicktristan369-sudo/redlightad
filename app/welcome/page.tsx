"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";
import { Check } from "lucide-react";

function WelcomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isNew = searchParams.get("new") === "1";
  const [loading, setLoading] = useState(false);

  const handleContinueFree = async () => {
    setLoading(true);
    // User already has a listing with status=pending and premium_tier=null
    // Just redirect to dashboard
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Logo />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-16">
        {isNew && (
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 text-green-600 mb-4" style={{ borderRadius: 0 }}>
              <Check className="w-8 h-8" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Welcome to RedLightAD!
            </h1>
            <p className="text-lg text-gray-600">
              Your profile has been created and is pending approval.
            </p>
          </div>
        )}

        <h2 className="text-2xl font-bold text-gray-900 text-center mb-12">
          Choose Your Profile Type
        </h2>

        {/* Cards Container */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Free Profile Card */}
          <div className="bg-white border-2 border-gray-200 p-8 flex flex-col" style={{ borderRadius: 0 }}>
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Free Profile</h3>
            
            <ul className="space-y-4 mb-8 flex-grow">
              <li className="flex items-start">
                <Check className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">Profile visible on RedLightAD</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">Must be approved within 48 hours</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">Standard placement (bottom of listings)</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">Basic contact info visible</span>
              </li>
            </ul>

            <div className="text-3xl font-bold text-gray-900 mb-6">
              Free
            </div>

            <button
              onClick={handleContinueFree}
              disabled={loading}
              className="w-full px-6 py-4 bg-gray-100 text-gray-900 font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ borderRadius: 0 }}
            >
              {loading ? "Please wait..." : "Continue with Free →"}
            </button>
          </div>

          {/* Premium Profile Card */}
          <div className="bg-gradient-to-br from-gray-900 to-black border-2 border-[#DC2626] p-8 flex flex-col relative overflow-hidden" style={{ borderRadius: 0 }}>
            {/* Featured Badge */}
            <div className="absolute top-4 right-4 bg-[#DC2626] text-white px-4 py-1 text-xs font-bold" style={{ borderRadius: 0 }}>
              RECOMMENDED
            </div>

            <h3 className="text-2xl font-bold text-white mb-6">PREMIUM PROFILE</h3>
            
            <ul className="space-y-4 mb-8 flex-grow">
              <li className="flex items-start">
                <Check className="w-5 h-5 text-[#DC2626] mr-3 flex-shrink-0 mt-0.5" />
                <span className="text-white font-medium">Always on top — maximum visibility</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-[#DC2626] mr-3 flex-shrink-0 mt-0.5" />
                <span className="text-white font-medium">3x more profile views</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-[#DC2626] mr-3 flex-shrink-0 mt-0.5" />
                <span className="text-white font-medium">Featured badge</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-[#DC2626] mr-3 flex-shrink-0 mt-0.5" />
                <span className="text-white font-medium">Priority placement</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-[#DC2626] mr-3 flex-shrink-0 mt-0.5" />
                <span className="text-white font-medium">More photos + videos</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-[#DC2626] mr-3 flex-shrink-0 mt-0.5" />
                <span className="text-white font-medium">Voice message feature</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-[#DC2626] mr-3 flex-shrink-0 mt-0.5" />
                <span className="text-white font-medium">Live cam feature</span>
              </li>
            </ul>

            <div className="text-3xl font-bold text-white mb-2">
              From €29/month
            </div>
            <p className="text-sm text-gray-400 mb-6">
              Multiple plans available
            </p>

            <Link
              href="/choose-plan"
              className="block w-full px-6 py-4 bg-[#DC2626] text-white font-bold text-center hover:bg-[#B91C1C] transition-colors"
              style={{ borderRadius: 0 }}
            >
              See Premium Prices →
            </Link>
          </div>
        </div>

        {/* Bottom Note */}
        <div className="text-center mt-12 text-sm text-gray-600">
          <p>You can upgrade to premium anytime from your dashboard.</p>
        </div>
      </main>
    </div>
  );
}

export default function WelcomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    }>
      <WelcomeContent />
    </Suspense>
  );
}
