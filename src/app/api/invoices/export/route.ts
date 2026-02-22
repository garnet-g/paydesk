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
        const status = searchParams.get('status')

        const where: any = { schoolId }
        if (status) where.status = status

        const invoices = await prisma.invoice.findMany({
            where,
            include: {
                student: { select: { firstName: true, lastName: true, admissionNumber: true } },
                academicPeriod: { select: { term: true, academicYear: true } }
            },
            orderBy: { createdAt: 'desc' }
        })

        // CSV Header
        let csv = 'Invoice Number,Student Name,Admission Number,Term,Year,Amount,Status,Date\n'

        // CSV Rows
        invoices.forEach(inv => {
            const row = [
                inv.invoiceNumber,
                `"${inv.student.firstName} ${inv.student.lastName}"`,
                inv.student.admissionNumber,
                inv.academicPeriod.term,
                inv.academicPeriod.academicYear,
                inv.totalAmount,
                inv.status,
                inv.createdAt.toISOString().split('T')[0]
            ].join(',')
            csv += row + '\n'
        })

        return new Response(csv, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="invoices_export_${Date.now()}.csv"`
            }
        })
    } catch (error) {
        console.error('Invoice Export Error:', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
