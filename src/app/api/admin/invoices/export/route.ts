import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateInvoicePDFBuffer, mergePDFs } from '@/lib/server-pdf'

export async function GET(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'PRINCIPAL' && session.user.role !== 'SUPER_ADMIN')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const classId = searchParams.get('classId')
    const academicPeriodId = searchParams.get('academicPeriodId')
    const schoolId = session.user.schoolId

    if (!schoolId) {
        return NextResponse.json({ error: 'School ID not found' }, { status: 400 })
    }

    try {
        const where: any = { schoolId }
        if (classId) where.student = { classId }
        if (academicPeriodId) where.academicPeriodId = academicPeriodId
        else {
            // Default to current active period
            const activePeriod = await prisma.academicPeriod.findFirst({ where: { schoolId, isActive: true } })
            if (activePeriod) where.academicPeriodId = activePeriod.id
        }

        const invoices = await prisma.invoice.findMany({
            where,
            include: {
                student: true,
                school: true,
                items: { where: { isDismissed: false } }
            },
            take: 100 // Limit for safety in MVP
        })

        if (invoices.length === 0) {
            return NextResponse.json({ error: 'No invoices found matching criteria' }, { status: 404 })
        }

        const pdfBuffers: ArrayBuffer[] = []
        for (const invoice of invoices) {
            const buffer = await generateInvoicePDFBuffer(invoice)
            pdfBuffers.push(buffer)
        }

        const mergedPdfBytes = await mergePDFs(pdfBuffers)

        return new Response(mergedPdfBytes as any, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="Invoices_Batch_${Date.now()}.pdf"`
            }
        })

    } catch (error: any) {
        console.error('Batch PDF Export Error:', error)
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}
