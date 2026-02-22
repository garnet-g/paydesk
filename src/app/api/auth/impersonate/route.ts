import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)

    // MUST be a globally authorized Super Admin
    if (!session || session.user.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { targetUserId } = await req.json()

        if (!targetUserId) {
            return NextResponse.json({ error: 'targetUserId is required' }, { status: 400 })
        }

        // Verify the target user exists
        const targetUser = await prisma.user.findUnique({
            where: { id: targetUserId },
            select: { id: true, role: true }
        })

        if (!targetUser) {
            return NextResponse.json({ error: 'Target user not found' }, { status: 404 })
        }

        // Generate a secure payload token
        const token = crypto.randomBytes(32).toString('hex')

        // Store token in DB (Valid for precisely 2 minutes)
        await prisma.impersonationToken.create({
            data: {
                token,
                userId: targetUserId,
                expiresAt: new Date(Date.now() + 2 * 60 * 1000)
            }
        })

        // Audit the impersonation attempt!
        await prisma.auditLog.create({
            data: {
                action: 'ADMIN_IMPERSONATION',
                entityType: 'User',
                entityId: targetUserId,
                userId: session.user.id,
                details: JSON.stringify({ targetRole: targetUser.role })
            }
        })

        return NextResponse.json({ success: true, token })

    } catch (error: any) {
        console.error('Impersonation token generation failed:', error)
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}
