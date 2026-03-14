"use client"

import { useEffect, useState } from "react"

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const
type Day = typeof DAYS[number]

const DAY_LABELS: Record<Day, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
}

interface DayHours {
  open: string
  close: string
  closed: boolean
}

type OpeningHours = Partial<Record<Day, DayHours>>

interface Props {
  openingHours: OpeningHours | null | undefined
  profileTimezone: string | null | undefined
}

function parseTime(timeStr: string): { h: number; m: number } {
  const [h, m] = timeStr.split(":").map(Number)
  return { h, m }
}

function convertTime(timeStr: string, fromTz: string, toTz: string, date: Date): string {
  try {
    const { h, m } = parseTime(timeStr)
    // Build a date in the source timezone
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    const sourceDate = new Date(`${year}-${month}-${day}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00`)

    // Format in target timezone
    const formatter = new Intl.DateTimeFormat("en-GB", {
      timeZone: toTz,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
    return formatter.format(sourceDate)
  } catch {
    return timeStr
  }
}

function getCurrentDayIndex(tz: string): number {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      weekday: "long",
    })
    const dayName = formatter.format(new Date()).toLowerCase() as Day
    return DAYS.indexOf(dayName)
  } catch {
    return new Date().getDay() === 0 ? 6 : new Date().getDay() - 1
  }
}

function isOpenNow(hours: DayHours, profileTz: string, visitorTz: string): boolean {
  if (hours.closed) return false
  try {
    const now = new Date()

    // Get current time in profile timezone
    const profileFormatter = new Intl.DateTimeFormat("en-US", {
      timeZone: profileTz,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
    const profileTime = profileFormatter.format(now)
    const [curH, curM] = profileTime.split(":").map(Number)
    const currentMinutes = curH * 60 + curM

    const { h: openH, m: openM } = parseTime(hours.open)
    const { h: closeH, m: closeM } = parseTime(hours.close)
    const openMinutes = openH * 60 + openM
    const closeMinutes = closeH * 60 + closeM

    return currentMinutes >= openMinutes && currentMinutes < closeMinutes
  } catch {
    return false
  }
}

function getTodayDayKey(tz: string): Day {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      weekday: "long",
    })
    return formatter.format(new Date()).toLowerCase() as Day
  } catch {
    const d = new Date().getDay()
    return DAYS[d === 0 ? 6 : d - 1]
  }
}

export default function OpeningHoursDisplay({ openingHours, profileTimezone }: Props) {
  const [visitorTz, setVisitorTz] = useState("UTC")
  const [todayKey, setTodayKey] = useState<Day>("monday")
  const [openNow, setOpenNow] = useState<boolean | null>(null)
  const [today] = useState(new Date())

  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    setVisitorTz(tz)
    setTodayKey(getTodayDayKey(profileTimezone || tz))

    if (openingHours && profileTimezone) {
      const todayK = getTodayDayKey(profileTimezone)
      const todayHours = openingHours[todayK]
      if (todayHours) {
        setOpenNow(isOpenNow(todayHours, profileTimezone, tz))
      } else {
        setOpenNow(false)
      }
    }
  }, [openingHours, profileTimezone])

  if (!openingHours) return null

  const profileTz = profileTimezone || "UTC"
  const sameTimezone = profileTz === visitorTz

  return (
    <div className="rounded-xl bg-white p-6 shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">Opening Hours</h3>
        {openNow !== null && (
          <div className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${
            openNow
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-600"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${openNow ? "bg-green-500" : "bg-red-500"}`} />
            {openNow ? "Open now" : "Closed now"}
          </div>
        )}
      </div>

      {/* Days table */}
      <div className="space-y-1.5">
        {DAYS.map((day) => {
          const hours = openingHours[day]
          const isToday = day === todayKey

          let openDisplay = "—"
          let closeDisplay = "—"
          let isClosed = true

          if (hours) {
            isClosed = hours.closed
            if (!isClosed) {
              openDisplay = sameTimezone
                ? hours.open
                : convertTime(hours.open, profileTz, visitorTz, today)
              closeDisplay = sameTimezone
                ? hours.close
                : convertTime(hours.close, profileTz, visitorTz, today)
            }
          }

          return (
            <div
              key={day}
              className={`flex items-center justify-between py-2 px-3 rounded-lg transition-colors ${
                isToday ? "bg-red-50" : "hover:bg-gray-50"
              }`}
            >
              <span className={`text-sm font-medium w-28 ${
                isToday ? "text-red-600 font-bold" : "text-gray-700"
              }`}>
                {DAY_LABELS[day]}
                {isToday && <span className="ml-1.5 text-xs font-normal text-red-400">(today)</span>}
              </span>
              {isClosed ? (
                <span className="text-sm text-gray-400">Closed</span>
              ) : (
                <span className={`text-sm tabular-nums ${isToday ? "text-red-600 font-semibold" : "text-gray-900"}`}>
                  {openDisplay} – {closeDisplay}
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* Timezone note */}
      {!sameTimezone && (
        <p className="mt-4 text-xs text-gray-400 text-center">
          Times shown in your local timezone ({visitorTz.replace("_", " ")})
        </p>
      )}
    </div>
  )
}
