"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import Logo from "@/components/Logo";

export default function CompleteRegistrationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient();
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        router.push("/login");
        return;
      }

      setUser(currentUser);
      setLoading(false);
    };

    checkUser();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F7]">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-2xl p-8 shadow-sm">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Logo variant="light" height={32} />
        </div>

        {/* Welcome message */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome!</h1>
          <p className="text-gray-500 text-[15px]">
            You're signed in as <span className="font-medium text-gray-700">{user?.email}</span>
          </p>
        </div>

        {/* Options */}
        <div className="space-y-4">
          <p className="text-center text-[14px] text-gray-600 mb-6">
            What would you like to do?
          </p>

          {/* Create listing (Provider) */}
          <Link
            href="/register/provider"
            className="block w-full py-4 px-6 bg-[#DC2626] text-white font-semibold text-center rounded-lg hover:bg-[#B91C1C] transition-colors"
          >
            <span className="block text-[15px]">Create a Listing</span>
            <span className="block text-[12px] font-normal opacity-80 mt-0.5">
              I want to advertise my services
            </span>
          </Link>

          {/* Browse as customer */}
          <Link
            href="/register/customer"
            className="block w-full py-4 px-6 bg-white border border-gray-200 text-gray-700 font-semibold text-center rounded-lg hover:bg-gray-50 transition-colors"
          >
            <span className="block text-[15px]">Browse as Customer</span>
            <span className="block text-[12px] font-normal text-gray-500 mt-0.5">
              I want to find services
            </span>
          </Link>
        </div>

        {/* Sign out link */}
        <p className="text-center text-[13px] text-gray-400 mt-8">
          Wrong account?{" "}
          <button
            onClick={async () => {
              const supabase = createClient();
              await supabase.auth.signOut();
              router.push("/login");
            }}
            className="text-gray-600 hover:underline"
          >
            Sign out
          </button>
        </p>
      </div>
    </div>
  );
}
