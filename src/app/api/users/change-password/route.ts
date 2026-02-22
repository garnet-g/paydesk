import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hash, compare } from 'bcryptjs'

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)

    if (!session) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    try {
        const { currentPassword, newPassword } = await req.json()

        if (!currentPassword || !newPassword) {
            return NextResponse.json({ error: 'Missing current or new password' }, { status: 400 })
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id }
        })

        if (!user) {
            return new NextResponse('User not found', { status: 404 })
        }

        const isPasswordCorrect = await compare(currentPassword, user.password)

        if (!isPasswordCorrect) {
            return NextResponse.json({ error: 'Incorrect current password' }, { status: 400 })
        }

        const hashedPassword = await hash(newPassword, 10)

        await (prisma.user as any).update({
            where: { id: session.user.id },
            data: {
                password: hashedPassword,
                requiresPasswordChange: false
            }
        })

        // Audit log
        await prisma.auditLog.create({
            data: {
                action: 'PASSWORD_CHANGED',
                entityType: 'User',
                entityId: user.id,
                userId: user.id,
            }
        })

        return NextResponse.json({ success: true })
    } catch (error: any) {
        return new NextResponse(error.message || 'Internal Server Error', { status: 500 })
    }
}
