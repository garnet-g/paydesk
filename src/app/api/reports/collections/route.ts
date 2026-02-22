import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session || ((session.user.role !== 'PRINCIPAL' && session.user.role !== 'FINANCE_MANAGER') && session.user.role !== 'SUPER_ADMIN')) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const dateParam = searchParams.get('date')

    // Parse date, default to today local
    const targetDate = dateParam ? new Date(dateParam) : new Date()

    // Determine start and end of day in UTC (Prisma uses UTC)
    // Assuming user inputs query in their local time, we might need adjustments.
    // Ideally, we handle timezones, but for simplicity we assume the date passed is local and we query roughly.
    // Better: Query where createdAt >= DateT00:00:00 and < DateT23:59:59

    // Simple approach: Construct Date objects
    const startOfDay = new Date(targetDate)
    startOfDay.setHours(0, 0, 0, 0)

    const endOfDay = new Date(targetDate)
    endOfDay.setHours(23, 59, 59, 999)

    try {
        const payments = await prisma.payment.findMany({
            where: {
                schoolId: session.user.schoolId!,
                status: 'COMPLETED',
                // Check createdAt OR completedAt
                OR: [
                    { completedAt: { gte: startOfDay, lte: endOfDay } },
                    // If completedAt is null (shouldn't be for COMPLETED), fallback to createdAt
                    { completedAt: null, createdAt: { gte: startOfDay, lte: endOfDay } }
                ]
            },
            include: {
                student: {
                    select: {
                        firstName: true,
                        lastName: true,
                        admissionNumber: true,
                        class: { select: { name: true } }
                    }
                }
            },
            orderBy: { completedAt: 'desc' }
        })

        const total = payments.reduce((sum, p) => sum + Number(p.amount), 0)

        const byMethod = payments.reduce((acc: any, p) => {
            acc[p.method] = (acc[p.method] || 0) + Number(p.amount)
            return acc
        }, {})

        return NextResponse.json({
            date: targetDate.toISOString().split('T')[0],
            total,
            byMethod,
            transactions: payments
        })
    } catch (error) {
        console.error('Collections report error:', error)
        return new NextResponse('Error fetching report', { status: 500 })
    }
}
