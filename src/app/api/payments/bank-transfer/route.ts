import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { CommunicationEngine } from '@/lib/communication'

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session || !['PRINCIPAL', 'FINANCE_MANAGER', 'SUPER_ADMIN'].includes(session.user.role)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { invoiceId, amount, bankReference, notes, paidAt } = await req.json()

        if (!invoiceId || !amount || !bankReference) {
            return NextResponse.json({ error: 'invoiceId, amount, and bankReference are required' }, { status: 400 })
        }

        // Fetch invoice with school auth check
        const invoice = await prisma.invoice.findUnique({
            where: { id: invoiceId },
            include: { student: true, school: true }
        })

        if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
        if (session.user.role !== 'SUPER_ADMIN' && invoice.schoolId !== session.user.schoolId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const paidAmount = parseFloat(amount)
        const newBalance = Math.max(0, Number(invoice.balance) - paidAmount)
        const newStatus = newBalance === 0 ? 'PAID' : 'PARTIALLY_PAID'

        // Create payment record
        const payment = await prisma.payment.create({
            data: {
                invoiceId,
                studentId: invoice.studentId,
                schoolId: invoice.schoolId,
                amount: paidAmount,
                method: 'BANK_TRANSFER',
                status: 'COMPLETED',
                transactionRef: bankReference,
                notes: notes || null,
                completedAt: paidAt ? new Date(paidAt) : new Date(),
            }
        })

        // Update invoice balance and status
        await prisma.invoice.update({
            where: { id: invoiceId },
            data: {
                balance: newBalance,
                status: newStatus,
                paidAmount: { increment: paidAmount }
            }
        })

        // Notify parent
        await CommunicationEngine.notifyPaymentReceived(payment.id)

        // Audit log
        await prisma.auditLog.create({
            data: {
                action: 'BANK_TRANSFER_RECORDED',
                entityType: 'Payment',
                entityId: payment.id,
                userId: session.user.id,
                schoolId: invoice.schoolId,
                details: JSON.stringify({ invoiceId, amount, bankReference })
            }
        })

        return NextResponse.json({ success: true, payment, invoiceStatus: newStatus })

    } catch (error: any) {
        console.error('Bank transfer record error:', error)
        return NextResponse.json({ error: error.message || 'Internal Error' }, { status: 500 })
    }
}
