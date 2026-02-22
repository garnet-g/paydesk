import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'SUPER_ADMIN') {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    try {
        const logs = await prisma.auditLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: 100,
            include: {
                user: { select: { firstName: true, lastName: true, email: true } },
                school: { select: { name: true, code: true } }
            }
        })
        return NextResponse.json(logs)
    } catch (error: any) {
        console.error('Failed to fetch logs:', error)
        return new NextResponse(error.message || 'Internal Server Error', { status: 500 })
    }
}
