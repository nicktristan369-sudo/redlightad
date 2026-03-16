"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type ConsentType = "all" | "necessary" | null;

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [btnHovAll, setBtnHovAll] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("cookie_consent");
    if (!stored) setVisible(true);
  }, []);

  const accept = (type: ConsentType) => {
    if (!type) return;
    localStorage.setItem("cookie_consent", type);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[9999] bg-white"
      style={{ borderTop: "1px solid #000", boxShadow: "0 -2px 16px rgba(0,0,0,0.06)" }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-4">
        {!showSettings ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-semibold text-gray-900 mb-0.5">We use cookies</p>
              <p className="text-[13px] text-gray-500">
                We use cookies to improve your experience and for analytics.{" "}
                <Link href="/cookies" className="underline hover:text-gray-900 transition-colors">
                  Cookie Policy
                </Link>
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
              <button
                onClick={() => setShowSettings(true)}
                className="px-4 py-2 text-[13px] font-medium text-gray-600 hover:text-gray-900 border border-gray-200 hover:border-gray-400 transition-colors"
                style={{ borderRadius: "8px" }}
              >
                Settings
              </button>
              <button
                onClick={() => accept("necessary")}
                className="px-4 py-2 text-[13px] font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                style={{ borderRadius: "8px" }}
              >
                Necessary only
              </button>
              <button
                onClick={() => accept("all")}
                className="px-4 py-2 text-[13px] font-semibold text-white transition-colors duration-200"
                style={{ background: btnHovAll ? "#CC0000" : "#000", borderRadius: "8px" }}
                onMouseEnter={() => setBtnHovAll(true)}
                onMouseLeave={() => setBtnHovAll(false)}
              >
                Accept all
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-[14px] font-semibold text-gray-900">Cookie Settings</p>
            <div className="space-y-3">
              {[
                { label: "Necessary cookies", desc: "Required for the website to function. Cannot be disabled.", locked: true },
                { label: "Analytics cookies", desc: "Help us understand how visitors interact with the site.", locked: false },
                { label: "Marketing cookies", desc: "Used to show relevant ads and content.", locked: false },
              ].map(item => (
                <div key={item.label} className="flex items-start justify-between gap-4 py-2"
                  style={{ borderBottom: "1px solid #F3F4F6" }}>
                  <div>
                    <p className="text-[13px] font-semibold text-gray-900">{item.label}</p>
                    <p className="text-[12px] text-gray-500">{item.desc}</p>
                  </div>
                  <div className="flex-shrink-0">
                    {item.locked
                      ? <span className="text-[11px] font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded-md">Always on</span>
                      : <span className="text-[11px] font-medium text-gray-400">Optional</span>
                    }
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowSettings(false)}
                className="px-4 py-2 text-[13px] font-medium text-gray-600 border border-gray-200 hover:border-gray-400 transition-colors"
                style={{ borderRadius: "8px" }}>
                Back
              </button>
              <button onClick={() => accept("necessary")}
                className="px-4 py-2 text-[13px] font-semibold text-white transition-colors duration-200"
                style={{ background: "#000", borderRadius: "8px" }}>
                Save preferences
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
