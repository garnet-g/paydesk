import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hash } from 'bcryptjs'

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'PRINCIPAL')) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    try {
        const { id } = await params

        const targetUser = await prisma.user.findUnique({
            where: { id },
            include: { school: true }
        })

        if (!targetUser) {
            return new NextResponse('User not found', { status: 404 })
        }

        // Principals can only reset passwords for users in their own school
        if (session.user.role === 'PRINCIPAL' && targetUser.schoolId !== session.user.schoolId) {
            return new NextResponse('Forbidden', { status: 403 })
        }

        const schoolName = targetUser.school?.name || 'School'
        const defaultPassword = `${schoolName}@123`
        const hashedPassword = await hash(defaultPassword, 10)

        await prisma.user.update({
            where: { id },
            data: {
                password: hashedPassword,
                requiresPasswordChange: true
            }
        })

        // Audit log
        await prisma.auditLog.create({
            data: {
                action: 'PASSWORD_RESET_BY_ADMIN',
                entityType: 'User',
                entityId: id,
                userId: session.user.id,
            }
        })

        return NextResponse.json({ success: true, defaultPassword })
    } catch (error: any) {
        return new NextResponse(error.message || 'Internal Server Error', { status: 500 })
    }
}
