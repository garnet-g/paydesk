import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
    req: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    const session = await getServerSession(authOptions)

    // Check for authorization
    if (!session || (session.user.role !== 'PRINCIPAL' && session.user.role !== 'SUPER_ADMIN')) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    try {
        const studentId = params.id
        const body = await req.json()
        const { description, amount, category } = body

        if (!description || !amount) {
            return new NextResponse('Description and amount are required', { status: 400 })
        }

        // 1. Find active academic period
        const activePeriod = await prisma.academicPeriod.findFirst({
            where: {
                schoolId: session.user.schoolId!,
                isActive: true
            }
        })

        if (!activePeriod) {
            return new NextResponse('No active academic period found. Please set one up in Settings -> Academic Periods.', { status: 400 })
        }

        // 2. Find existing PENDING invoice for this student in this period
        let invoice = await prisma.invoice.findFirst({
            where: {
                studentId,
                academicPeriodId: activePeriod.id,
                status: 'PENDING'
            }
        })

        // 3. If no pending invoice, create one
        if (!invoice) {
            // Standard deterministic invoice number: INV-YYYY-TERM-ADMNO
            const invoiceNumber = `INV-${activePeriod.academicYear}-${activePeriod.term}-${studentId.slice(-5).toUpperCase()}`
            // Note: studentId slice is a fallback if admNo isn't available, 
            // but let's fetch student record to get the actual admission number.
            const student = await prisma.student.findUnique({
                where: { id: studentId },
                select: { admissionNumber: true }
            })

            const finalNumber = `INV-${activePeriod.academicYear}-${activePeriod.term}-${student?.admissionNumber || studentId.slice(-5)}`

            invoice = await prisma.invoice.create({
                data: {
                    invoiceNumber: finalNumber,
                    totalAmount: 0,
                    paidAmount: 0,
                    balance: 0,
                    status: 'PENDING',
                    academicPeriodId: activePeriod.id,
                    schoolId: session.user.schoolId!,
                    studentId,
                    dueDate: activePeriod.endDate,
                }
            })
        }

        // 4. Add Invoice Item
        // Ensure amount is handled as Decimal or float
        const itemAmount = parseFloat(amount.toString())

        await prisma.invoiceItem.create({
            data: {
                description,
                amount: itemAmount,
                unitPrice: itemAmount,
                quantity: 1,
                category: category || 'OTHER',
                invoiceId: invoice.id
            }
        })

        // 5. Update Invoice Totals
        // Recalculate totals from scratch to ensure accuracy (handling multiple items, deletions, etc.)
        const allItems = await prisma.invoiceItem.findMany({
            where: { invoiceId: invoice.id }
        })

        const total = allItems.reduce((sum, item) => sum + Number(item.amount), 0)

        // Fetch fresh payment data just in case? No, relying on invoice.paidAmount is usually fine unless concurrent edits.
        // But for balance accuracy:
        const balance = total - Number(invoice.paidAmount)

        await prisma.invoice.update({
            where: { id: invoice.id },
            data: {
                totalAmount: total,
                balance: balance
            }
        })

        return NextResponse.json({ success: true })

    } catch (error: any) {
        console.error('Failed to add fee:', error)
        return new NextResponse(error.message || 'Internal Server Error', { status: 500 })
    }
}
