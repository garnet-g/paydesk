import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session || !['PRINCIPAL', 'SUPER_ADMIN', 'FINANCE_MANAGER'].includes(session.user.role)) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    try {
        const { searchParams } = new URL(req.url)
        const schoolId = session.user.schoolId as string
        const date = searchParams.get('date')

        const where: any = session.user.role === 'SUPER_ADMIN' ? {} : { schoolId }

        if (date) {
            const startDate = new Date(date)
            startDate.setHours(0, 0, 0, 0)
            const endDate = new Date(date)
            endDate.setHours(23, 59, 59, 999)
            where.createdAt = { gte: startDate, lte: endDate }
        }

        const payments = await prisma.payment.findMany({
            where,
            include: {
                student: { select: { firstName: true, lastName: true, admissionNumber: true } },
                school: { select: { name: true } }
            },
            orderBy: { createdAt: 'desc' }
        })

        // CSV Header
        let csv = 'Transaction Ref,Student,Adm No,School,Amount,Method,Status,Date\n'

        payments.forEach(p => {
            const row = [
                p.transactionRef || p.id,
                `"${p.student.firstName} ${p.student.lastName}"`,
                p.student.admissionNumber,
                `"${p.school.name}"`,
                p.amount,
                p.method,
                p.status,
                p.createdAt.toISOString().split('T')[0]
            ].join(',')
            csv += row + '\n'
        })

        return new Response(csv, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="payments_export_${Date.now()}.csv"`
            }
        })
    } catch (error) {
        console.error('Payment Export Error:', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
