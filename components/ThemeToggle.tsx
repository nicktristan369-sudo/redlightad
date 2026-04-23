"use client";

import { useTheme } from "@/lib/theme-context";
import { Moon, Sun, Monitor } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface ThemeToggleProps {
  variant?: "icon" | "dropdown" | "switch";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function ThemeToggle({ 
  variant = "icon", 
  size = "md",
  className = "" 
}: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const iconSize = size === "sm" ? 16 : size === "lg" ? 24 : 20;

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (variant === "switch") {
    return (
      <button
        onClick={toggleTheme}
        className={`relative inline-flex items-center h-6 w-11 rounded-full transition-colors ${
          resolvedTheme === "dark" ? "bg-red-600" : "bg-gray-300"
        } ${className}`}
        aria-label="Toggle theme"
      >
        <span
          className={`inline-block h-4 w-4 rounded-full bg-white transform transition-transform ${
            resolvedTheme === "dark" ? "translate-x-6" : "translate-x-1"
          }`}
        />
        <Sun 
          size={10} 
          className={`absolute left-1.5 text-yellow-500 transition-opacity ${
            resolvedTheme === "dark" ? "opacity-0" : "opacity-100"
          }`} 
        />
        <Moon 
          size={10} 
          className={`absolute right-1.5 text-white transition-opacity ${
            resolvedTheme === "dark" ? "opacity-100" : "opacity-0"
          }`} 
        />
      </button>
    );
  }

  if (variant === "dropdown") {
    return (
      <div className={`relative ${className}`} ref={dropdownRef}>
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Theme settings"
        >
          {resolvedTheme === "dark" ? (
            <Moon size={iconSize} className="text-gray-300" />
          ) : (
            <Sun size={iconSize} className="text-gray-600" />
          )}
        </button>
        
        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
            {[
              { value: "light" as const, label: "Light", icon: Sun },
              { value: "dark" as const, label: "Dark", icon: Moon },
              { value: "system" as const, label: "System", icon: Monitor },
            ].map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => {
                  setTheme(value);
                  setDropdownOpen(false);
                }}
                className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
                  theme === value 
                    ? "text-red-600 dark:text-red-500 font-medium" 
                    : "text-gray-700 dark:text-gray-300"
                }`}
              >
                <Icon size={16} />
                {label}
                {theme === value && (
                  <span className="ml-auto text-red-600 dark:text-red-500">✓</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Default: simple icon toggle
  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${className}`}
      aria-label={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
    >
      {resolvedTheme === "dark" ? (
        <Sun size={iconSize} className="text-yellow-400" />
      ) : (
        <Moon size={iconSize} className="text-gray-600" />
      )}
    </button>
  );
}
