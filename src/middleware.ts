import { withAuth } from 'next-auth/middleware'

export default withAuth({
    pages: {
        signIn: '/login',
    },
    callbacks: {
        authorized: ({ req, token }) => {
            const { pathname } = req.nextUrl
            // Exempt M-Pesa webhooks from authentication
            if (
                pathname === '/api/payments/mpesa/callback' ||
                pathname.startsWith('/api/payments/mpesa/c2b/')
            ) {
                return true
            }
            // All other protected routes require a token
            return !!token
        }
    }
})

export const config = {
    matcher: [
        '/dashboard/:path*',
        '/api/students/:path*',
        '/api/parents/:path*',
        '/api/classes/:path*',
        '/api/academic-periods/:path*',
        '/api/payments/:path*',
        '/api/invoices/:path*',
        '/api/schools/:path*',
        '/api/users/:path*',
    ],
}
