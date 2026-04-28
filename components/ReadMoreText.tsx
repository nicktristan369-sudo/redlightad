"use client"
import { useState } from "react"

interface ReadMoreTextProps {
  text: string
  maxChars?: number
  className?: string
}

export default function ReadMoreText({ text, maxChars = 300, className = "" }: ReadMoreTextProps) {
  const [expanded, setExpanded] = useState(false)

  if (text.length <= maxChars) {
    return <p className={`text-sm leading-relaxed text-gray-600 whitespace-pre-wrap break-words overflow-hidden ${className}`}>{text}</p>
  }

  return (
    <div>
      <p className={`text-sm leading-relaxed text-gray-600 whitespace-pre-wrap break-words overflow-hidden ${className}`}>
        {expanded ? text : text.slice(0, maxChars).trimEnd() + "..."}
      </p>
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          marginTop: 10,
          fontSize: 13,
          fontWeight: 700,
          color: "#DC2626",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
          textDecoration: "underline",
          textUnderlineOffset: 2,
        }}
      >
        {expanded ? "Show less" : "Read more"}
      </button>
    </div>
  )
}
