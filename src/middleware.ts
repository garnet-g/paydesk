import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

// ─── In-memory rate limiter (per IP) ───────────────────────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function rateLimit(ip: string, limit: number, windowMs: number): boolean {
    const now = Date.now()
    const entry = rateLimitMap.get(ip)

    if (!entry || now > entry.resetAt) {
        rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs })
        return true // allowed
    }

    if (entry.count >= limit) return false // blocked

    entry.count++
    return true // allowed
}

// Clean up old entries every 5 minutes to prevent memory leak
setInterval(() => {
    const now = Date.now()
    for (const [ip, entry] of rateLimitMap.entries()) {
        if (now > entry.resetAt) rateLimitMap.delete(ip)
    }
}, 5 * 60 * 1000)

// ─── Route config ───────────────────────────────────────────────────────────
const PUBLIC_PATHS = ['/api/auth', '/login', '/_next', '/favicon', '/public']
const AUTH_PATHS = ['/dashboard', '/api']  // require login

// Stricter limits for sensitive endpoints
const STRICT_PATHS = ['/api/auth/signin', '/api/users/change-password', '/api/admin']
const STRICT_LIMIT = 10   // 10 requests per minute
const DEFAULT_LIMIT = 120  // 120 requests per minute

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl

    // ── 1. Skip static files ─────────────────────────────────────────────────
    if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
        return NextResponse.next()
    }

    // ── 2. Rate limiting ─────────────────────────────────────────────────────
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        ?? req.headers.get('x-real-ip')
        ?? '127.0.0.1'

    const isStrict = STRICT_PATHS.some(p => pathname.startsWith(p))
    const limit = isStrict ? STRICT_LIMIT : DEFAULT_LIMIT
    const window = isStrict ? 60_000 : 60_000 // 1 minute window

    if (!rateLimit(ip, limit, window)) {
        return NextResponse.json(
            { error: 'Too many requests. Please slow down.' },
            {
                status: 429,
                headers: {
                    'Retry-After': '60',
                    'X-RateLimit-Limit': String(limit),
                },
            }
        )
    }

    // ── 3. Auth check for protected routes ───────────────────────────────────
    const requiresAuth = AUTH_PATHS.some(p => pathname.startsWith(p))
    // Skip NextAuth's own API routes
    if (requiresAuth && !pathname.startsWith('/api/auth')) {
        const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
        if (!token) {
            if (pathname.startsWith('/api/')) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
            }
            return NextResponse.redirect(new URL('/login', req.url))
        }
    }

    // ── 4. Security headers ──────────────────────────────────────────────────
    const response = NextResponse.next()
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
    response.headers.set(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co;"
    )

    return response
}

export const config = {
    matcher: [
        // Match all routes except static files
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
