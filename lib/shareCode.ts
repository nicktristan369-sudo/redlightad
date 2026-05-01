/**
 * Generate a short anonymous share code from a listing UUID.
 * Deterministic — same ID always gives same code.
 * No DB column needed.
 */
export function shareCodeFromId(uuid: string): string {
  const hex = uuid.replace(/-/g, '').slice(0, 10)
  const num = parseInt(hex, 16)
  return num.toString(36).slice(0, 8).padStart(8, '0')
}

/**
 * Given a share code, recover the UUID text prefix for DB lookup.
 * UUID format: xxxxxxxx-xxxx-... so 10 hex chars = 8 chars + dash + 2 chars
 */
export function uuidPrefixFromCode(code: string): string {
  const num = parseInt(code, 36)
  const hex = num.toString(16).padStart(10, '0')
  // Convert hex prefix back to UUID prefix format: xxxxxxxx-xx
  return hex.slice(0, 8) + '-' + hex.slice(8, 10)
}
