import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions)

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { id: studentId } = await params
        const student = await prisma.student.findUnique({
            where: { id: studentId },
            include: { school: true }
        })

        if (!student) {
            return new NextResponse('Student not found', { status: 404 })
        }

        // Access Control
        if (session.user.role === 'PARENT') {
            // Verify guardian relationship
            const guardianship = await prisma.studentGuardian.findFirst({
                where: {
                    studentId,
                    userId: session.user.id
                }
            })
            if (!guardianship) {
                return new NextResponse('Unauthorized', { status: 403 })
            }
        } else if (session.user.role === 'PRINCIPAL') {
            if (student.schoolId !== session.user.schoolId) {
                return new NextResponse('Unauthorized', { status: 403 })
            }
        } else if (session.user.role !== 'SUPER_ADMIN') {
            return new NextResponse('Unauthorized', { status: 403 })
        }

        // Fetch Invoices
        const invoices = await prisma.invoice.findMany({
            where: { studentId },
            select: {
                id: true,
                createdAt: true,
                invoiceNumber: true,
                totalAmount: true,
                items: {
                    select: { description: true, amount: true }
                }
            }
        })

        // Fetch Payments
        const payments = await prisma.payment.findMany({
            where: { studentId, status: 'COMPLETED' }, // Only completed payments
            select: {
                id: true,
                createdAt: true,
                receiptNumber: true,
                amount: true,
                method: true
            }
        })

        // Combine and Sort
        let transactions = [
            ...invoices.map(inv => ({
                id: inv.id,
                date: inv.createdAt,
                type: 'INVOICE',
                amount: Number(inv.totalAmount), // Debit (+)
                description: `Invoice #${inv.invoiceNumber}`,
                details: inv.items.map(i => `${i.description} (${i.amount})`).join(', ')
            })),
            ...payments.map(pay => ({
                id: pay.id,
                date: pay.createdAt,
                type: 'PAYMENT',
                amount: -Number(pay.amount), // Credit (-)
                description: `Payment via ${pay.method}`,
                details: `Receipt #${pay.receiptNumber || 'N/A'}`
            }))
        ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

        // Calculate Running Balance
        let balance = 0
        const statement = transactions.map(t => {
            balance += t.amount
            return {
                ...t,
                runningBalance: balance
            }
        })

        // Return reversed (newest first) for UI display?
        // Or keep chronological. Chronological is better for Ledger.
        // Let's return chronological (oldest first).

        return NextResponse.json({
            student: {
                name: `${student.firstName} ${student.lastName}`,
                admissionNumber: student.admissionNumber,
                schoolName: student.school.name,
                school: student.school
            },
            statement
        })
    } catch (error) {
        console.error('Failed to fetch statement:', error)
        return new NextResponse('Internal Server Error', { status: 500 })
    }
}
