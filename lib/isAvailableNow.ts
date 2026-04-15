export function isAvailableNow(
  hours: Record<string, { open: string; close: string; closed: boolean }> | null | undefined,
  tz: string | null | undefined
): boolean {
  if (!hours || !tz) return false
  try {
    const now = new Date()
    const day = new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "long" })
      .format(now).toLowerCase()
    const h = hours[day]
    if (!h || h.closed) return false

    const timeStr = new Intl.DateTimeFormat("en-GB", {
      timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: false,
    }).format(now)

    const [ch, cm] = timeStr.split(":").map(Number)
    const [oh, om] = h.open.split(":").map(Number)
    const [clh, clm] = h.close.split(":").map(Number)

    const current = ch * 60 + cm
    const open = oh * 60 + om
    const close = clh * 60 + clm

    // Handle overnight: e.g. open 09:00, close 05:00 next day
    if (close <= open) {
      // Open past midnight — available if current >= open OR current < close
      return current >= open || current < close
    }

    return current >= open && current < close
  } catch { return false }
}
