import 'next-auth'

declare module 'next-auth' {
    interface User {
        role?: string
        schoolId?: string | null
        schoolName?: string
        phoneNumber?: string | null
        requiresPasswordChange?: boolean
        logoUrl?: string | null
        planTier?: string
    }

    interface Session {
        user: {
            id: string
            email: string
            name?: string | null
            role: string
            schoolId: string | null
            schoolName?: string
            phoneNumber?: string
            requiresPasswordChange: boolean
            logoUrl?: string | null
            planTier?: string
        }
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        role?: string
        schoolId?: string | null
        schoolName?: string
        phoneNumber?: string
        requiresPasswordChange?: boolean
        logoUrl?: string | null
        planTier?: string
    }
}
