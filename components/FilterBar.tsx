"use client";

import { useState } from "react";

const filters = ["Location", "Categories", "Gender", "Custom Search"];

export default function FilterBar() {
  const [active, setActive] = useState("Location");

  return (
    <div className="border-b border-gray-200 bg-gray-50">
      <div className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-4 py-3">
        {filters.map((filter) => (
          <button
            key={filter}
            onClick={() => setActive(filter)}
            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              active === filter
                ? "bg-red-600 text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"
            }`}
          >
            {filter}
          </button>
        ))}
      </div>
    </div>
  );
}
