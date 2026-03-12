"use client";

import { useEffect, useState } from "react";

export default function AgeVerificationModal() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const verified = localStorage.getItem("age_verified");
    if (verified !== "true") {
      setShow(true);
    }
  }, []);

  if (!show) return null;

  function handleConfirm() {
    localStorage.setItem("age_verified", "true");
    setShow(false);
  }

  function handleExit() {
    window.location.href = "https://www.google.com";
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center shadow-2xl">
        <h2 className="mb-2 text-2xl font-bold text-red-500">RedLightAD</h2>
        <div className="mb-6 h-px bg-zinc-700" />
        <p className="mb-8 text-zinc-300">
          This website contains adult content. You must be 18 or older to enter.
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={handleConfirm}
            className="w-full rounded-lg bg-red-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-red-700"
          >
            I am 18+ — Enter
          </button>
          <button
            onClick={handleExit}
            className="w-full rounded-lg border border-zinc-600 px-6 py-3 font-semibold text-zinc-400 transition-colors hover:bg-zinc-800"
          >
            Exit
          </button>
        </div>
      </div>
    </div>
  );
}
