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
 * Given a share code, recover the hex prefix to query DB.
 * We store the first 10 hex chars of the UUID as the code source.
 */
export function hexPrefixFromCode(code: string): string {
  const num = parseInt(code, 36)
  return num.toString(16).padStart(10, '0')
}
