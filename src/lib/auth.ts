import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export const authOptions: NextAuthOptions = {
    session: {
        strategy: 'jwt',
        maxAge: 7 * 24 * 60 * 60, // 7 days expiration
    },
    pages: {
        signIn: '/login',
    },
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
                impersonateToken: { label: 'Token', type: 'text' },
            },
            async authorize(credentials: any) {
                if (credentials?.impersonateToken) {
                    const tokenRecord = await prisma.impersonationToken.findUnique({
                        where: { token: credentials.impersonateToken }
                    })
                    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
                        throw new Error('Invalid or expired impersonation token')
                    }

                    const user = await prisma.user.findUnique({
                        where: { id: tokenRecord.userId },
                        include: { school: true }
                    })

                    if (!user || !user.isActive) throw new Error('User not allowed')

                    // Consume token
                    await prisma.impersonationToken.delete({ where: { id: tokenRecord.id } })

                    return {
                        id: user.id,
                        email: user.email,
                        name: `${user.firstName} ${user.lastName}`,
                        role: user.role,
                        schoolId: user.schoolId,
                        schoolName: user.school?.name || 'System',
                        phoneNumber: user.phoneNumber || '',
                        requiresPasswordChange: user.requiresPasswordChange,
                        logoUrl: user.school?.logoUrl || null,
                        planTier: (user.school as any)?.planTier || 'FREE',
                    } as any
                }

                if (!credentials?.email || !credentials?.password) {
                    throw new Error('Invalid credentials')
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email },
                    include: { school: true },
                })

                if (!user || !user.isActive) {
                    throw new Error('Invalid credentials')
                }

                const isPasswordValid = await compare(credentials.password, user.password)

                if (!isPasswordValid) {
                    throw new Error('Invalid credentials')
                }

                // Update last login
                await prisma.user.update({
                    where: { id: user.id },
                    data: { lastLogin: new Date() },
                })

                // Create audit log
                await prisma.auditLog.create({
                    data: {
                        action: 'LOGIN',
                        entityType: 'User',
                        entityId: user.id,
                        userId: user.id,
                        schoolId: user.schoolId,
                    },
                })

                return {
                    id: user.id,
                    email: user.email,
                    name: `${user.firstName} ${user.lastName}`,
                    role: user.role,
                    schoolId: user.schoolId,
                    schoolName: user.school?.name || 'System',
                    phoneNumber: user.phoneNumber || '',
                    requiresPasswordChange: user.requiresPasswordChange,
                    logoUrl: user.school?.logoUrl || null,
                    planTier: (user.school as any)?.planTier || 'FREE',
                } as any
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            // Initial sign in
            if (user) {
                token.role = user.role
                token.schoolId = user.schoolId
                token.schoolName = user.schoolName
                token.phoneNumber = user.phoneNumber || undefined
                token.requiresPasswordChange = (user as any).requiresPasswordChange
                token.logoUrl = (user as any).logoUrl
                token.planTier = (user as any).planTier || 'FREE'

                // Set initial token rotation timestamp and expiry
                token.accessTokenExpires = Date.now() + 7 * 24 * 60 * 60 * 1000;
            }

            // Implement basic rolling session logic
            // If the token is halfway to expiring, we'll implicitly update its expiration
            // The NextAuth session cookie maxAge will handle the actual client-side expiry

            // Explicit updates
            if (trigger === 'update') {
                if (session?.requiresPasswordChange !== undefined) {
                    token.requiresPasswordChange = session.requiresPasswordChange
                }
                if (session?.user?.logoUrl !== undefined) {
                    token.logoUrl = session.user.logoUrl
                }
            }

            return token
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.sub!
                session.user.role = token.role as string
                session.user.schoolId = token.schoolId as string | null
                session.user.schoolName = (token.schoolName as string) || 'System'
                session.user.phoneNumber = (token.phoneNumber as string) || ''
                session.user.requiresPasswordChange = !!token.requiresPasswordChange
                session.user.logoUrl = (token.logoUrl as string) || null
                session.user.planTier = (token.planTier as string) || 'FREE'
            }
            return session
        },
    },
}
