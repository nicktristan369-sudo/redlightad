// Generate a URL-friendly slug from a name
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    .slice(0, 50) // Max 50 chars
}

// Generate a unique slug by appending a short random suffix if needed
export function generateUniqueSlug(name: string): string {
  const base = generateSlug(name)
  const suffix = Math.random().toString(36).substring(2, 6)
  return `${base}-${suffix}`
}
