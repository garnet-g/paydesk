/**
 * Input Sanitization & Validation Library
 *
 * Centralises all sanitisation rules so they are applied consistently
 * across every API route. Every function is pure (no side-effects).
 */

// ─── String sanitization ──────────────────────────────────────────────────────

/**
 * Trim, collapse interior whitespace, remove control characters.
 * Safe to call on any text field before storing.
 */
export function sanitizeString(value: unknown, maxLength = 500): string {
    if (value == null) return ''
    return String(value)
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // strip control chars (keep \n \r \t)
        .trim()
        .replace(/\s+/g, ' ')                               // collapse interior whitespace
        .slice(0, maxLength)
}

/**
 * Sanitize a name field — letters, spaces, hyphens, apostrophes only.
 * Strips digits and special chars that don't belong in a person's name.
 */
export function sanitizeName(value: unknown, maxLength = 100): string {
    return sanitizeString(value, maxLength)
        .replace(/[^a-zA-Z\u00C0-\u024F\s'\-\.]/g, '') // allow accented chars, spaces, apostrophe, hyphen, dot
        .trim()
}

/**
 * Normalize and validate an email address.
 * Returns null if invalid.
 */
export function sanitizeEmail(value: unknown): string | null {
    if (value == null) return null
    const cleaned = String(value).trim().toLowerCase().slice(0, 254)
    // RFC-5322 simplified check
    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
    return EMAIL_RE.test(cleaned) ? cleaned : null
}

/**
 * Normalize a Kenyan phone number to +2547XXXXXXXX format.
 * Returns null if it can't be normalised.
 */
export function sanitizePhone(value: unknown): string | null {
    if (value == null) return null
    // Strip everything that isn't a digit or leading +
    let raw = String(value).replace(/[^\d+]/g, '')
    if (raw.startsWith('+')) raw = raw.slice(1)       // drop leading +
    if (raw.startsWith('0') && raw.length === 10) raw = '254' + raw.slice(1)   // 07XX → 2547XX
    if (raw.startsWith('7') && raw.length === 9) raw = '254' + raw             // 7XXXXXXXX → 2547XX
    if (!/^254\d{9}$/.test(raw)) return null           // must be 254 + 9 digits
    return '+' + raw
}

/**
 * Parse and validate a positive monetary amount.
 * Returns null if invalid, negative, or exceeds the cap.
 */
export function sanitizeAmount(value: unknown, maxAmount = 10_000_000): number | null {
    const n = typeof value === 'string' ? parseFloat(value) : Number(value)
    if (isNaN(n) || n <= 0 || n > maxAmount) return null
    // Round to 2 dp to prevent floating-point drift in the ledger
    return Math.round(n * 100) / 100
}

/**
 * Validate a string is a known enum value.
 */
export function sanitizeEnum<T extends string>(value: unknown, allowed: readonly T[]): T | null {
    if (typeof value !== 'string') return null
    const upper = value.toUpperCase() as T
    return (allowed as readonly string[]).includes(upper) ? upper : null
}

/**
 * Sanitize a free-text notes/description field.
 * Strips HTML tags and limits length.
 */
export function sanitizeNotes(value: unknown, maxLength = 1000): string {
    return sanitizeString(value, maxLength)
        .replace(/<[^>]*>/g, '')   // strip HTML tags
}

/**
 * Validate a UUID v4 string (Prisma generated IDs).
 * Returns null if the value doesn't look like a UUID.
 */
export function sanitizeId(value: unknown): string | null {
    if (typeof value !== 'string') return null
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    return UUID_RE.test(value.trim()) ? value.trim() : null
}

/**
 * Sanitize a date string — must be a parseable date and not in the future
 * by more than a configurable range, and not before year 2000.
 */
export function sanitizeDate(value: unknown): Date | null {
    if (value == null) return null
    const d = new Date(String(value))
    if (isNaN(d.getTime())) return null
    if (d.getFullYear() < 2000) return null               // sanity lower bound
    if (d.getFullYear() > new Date().getFullYear() + 5) return null // sanity upper bound
    return d
}

/**
 * Strip dangerous query-string search terms (prevent ReDoS).
 * Limit length and remove regex special chars that won't be useful.
 */
export function sanitizeSearchQuery(value: unknown, maxLength = 100): string {
    return sanitizeString(value, maxLength)
        .replace(/[.*+?^${}()|[\]\\]/g, '')  // strip regex metacharacters
}

/**
 * Sanitize an admission number — alphanumeric, slashes, hyphens.
 */
export function sanitizeAdmNo(value: unknown): string | null {
    if (value == null) return null
    const cleaned = String(value).trim().slice(0, 50)
    return /^[a-zA-Z0-9\/\-_]+$/.test(cleaned) ? cleaned : null
}

// ─── Batch result helper ──────────────────────────────────────────────────────

/** Collect field-level validation errors in a flat object. */
export function buildValidationError(
    errors: Record<string, string>
): { valid: false; errors: Record<string, string> } {
    return { valid: false, errors }
}

export function buildValidationSuccess<T>(
    data: T
): { valid: true; data: T } {
    return { valid: true, data }
}
