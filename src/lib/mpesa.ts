/**
 * M-Pesa / Daraja API helpers
 *
 * All functions accept optional per-school credentials.
 * If not provided, they fall back to global env vars (useful for sandbox/testing).
 */

interface MpesaCreds {
    consumerKey?: string | null
    consumerSecret?: string | null
    shortcode?: string | null
    passkey?: string | null
    env?: string | null
}

/**
 * Get an access token from Daraja.
 * Uses school-specific credentials if provided, otherwise falls back to env vars.
 */
export async function getMpesaAccessToken(creds?: MpesaCreds): Promise<string> {
    const consumerKey = creds?.consumerKey || process.env.MPESA_CONSUMER_KEY
    const consumerSecret = creds?.consumerSecret || process.env.MPESA_CONSUMER_SECRET
    const mpesaEnv = creds?.env || process.env.MPESA_ENV || 'sandbox'

    if (!consumerKey || !consumerSecret) {
        throw new Error('M-Pesa consumer key and secret are required.')
    }

    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64')
    const baseUrl = mpesaEnv === 'production'
        ? 'https://api.safaricom.co.ke'
        : 'https://sandbox.safaricom.co.ke'

    const url = `${baseUrl}/oauth/v1/generate?grant_type=client_credentials`

    const response = await fetch(url, {
        headers: { Authorization: `Basic ${auth}` },
    })

    if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err.errorMessage || 'Failed to get M-Pesa access token')
    }

    const data = await response.json()
    return data.access_token
}

export function generateMpesaTimestamp(): string {
    const now = new Date()
    return [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, '0'),
        String(now.getDate()).padStart(2, '0'),
        String(now.getHours()).padStart(2, '0'),
        String(now.getMinutes()).padStart(2, '0'),
        String(now.getSeconds()).padStart(2, '0'),
    ].join('')
}

export function generateMpesaPassword(shortCode: string, passKey: string, timestamp: string): string {
    return Buffer.from(`${shortCode}${passKey}${timestamp}`).toString('base64')
}

/**
 * Get the Daraja base URL based on environment
 */
export function getMpesaBaseUrl(env?: string | null): string {
    return (env || process.env.MPESA_ENV) === 'production'
        ? 'https://api.safaricom.co.ke'
        : 'https://sandbox.safaricom.co.ke'
}
