import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
    const session = await getServerSession(authOptions)

    if (!session) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    const { role, id: userId, schoolId } = session.user

    try {
        let payments: any[] = []

        if (role === 'SUPER_ADMIN') {
            payments = await prisma.payment.findMany({
                take: 10,
                orderBy: { createdAt: 'desc' },
                include: {
                    student: true,
                    school: true,
                }
            })
        } else if (role === 'PRINCIPAL' || role === 'FINANCE_MANAGER') {
            payments = await prisma.payment.findMany({
                where: { schoolId: schoolId! },
                take: 10,
                orderBy: { createdAt: 'desc' },
                include: {
                    student: true,
                }
            })
        } else if (role === 'PARENT') {
            // Find students linked to this parent
            const guardianships = await prisma.studentGuardian.findMany({
                where: { userId },
                select: { studentId: true }
            })
            const studentIds = guardianships.map(g => g.studentId)

            payments = await prisma.payment.findMany({
                where: {
                    studentId: { in: studentIds }
                },
                take: 10,
                orderBy: { createdAt: 'desc' },
                include: {
                    student: true,
                }
            })
        }

        return NextResponse.json(payments)
    } catch (error: any) {
        console.error('Dashboard payments fetch error:', error)
        return new NextResponse(error.message || 'Internal Server Error', { status: 500 })
    }
}
