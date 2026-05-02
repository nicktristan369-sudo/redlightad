"use client"
import { LayoutList, LayoutGrid } from "lucide-react"

interface ViewToggleProps {
  view: "list" | "grid"
  onChange: (v: "list" | "grid") => void
}

export default function ViewToggle({ view, onChange }: ViewToggleProps) {
  return (
    <div className="flex items-center gap-1">
      <button onClick={() => onChange("list")} aria-label="List view"
        className={view === "list" ? "text-red-600" : "text-gray-500 hover:text-gray-600"}>
        <LayoutList size={20} />
      </button>
      <button onClick={() => onChange("grid")} aria-label="Grid view"
        className={view === "grid" ? "text-red-600" : "text-gray-500 hover:text-gray-600"}>
        <LayoutGrid size={20} />
      </button>
    </div>
  )
}
