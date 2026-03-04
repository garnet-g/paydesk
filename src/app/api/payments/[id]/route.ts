import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'PRINCIPAL' && session.user.role !== 'FINANCE_MANAGER')) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    try {
        const { id } = await params
        const { status, notes } = await req.json()

        // Fetch the payment before modifying so we can reverse the invoice if needed
        const existingPayment = await prisma.payment.findUnique({
            where: { id },
            select: { id: true, amount: true, invoiceId: true, status: true, schoolId: true }
        })

        if (!existingPayment) {
            return new NextResponse('Payment not found', { status: 404 })
        }

        // School ownership guard for non-super-admins
        if (session.user.role !== 'SUPER_ADMIN' && existingPayment.schoolId !== session.user.schoolId) {
            return new NextResponse('Forbidden', { status: 403 })
        }

        const updatedPayment = await prisma.$transaction(async (tx) => {
            const payment = await tx.payment.update({
                where: { id },
                data: {
                    status: status || undefined,
                    notes: notes || undefined,
                },
            })

            // ── Fix #5: Reverse invoice balance on REFUNDED/DISPUTED/FAILED ─────
            // When a previously COMPLETED payment is reversed, add the amount back
            // to the invoice so the student's balance is accurate.
            const wasCompleted = existingPayment.status === 'COMPLETED'
            const isNowReversed = status === 'REFUNDED' || status === 'DISPUTED' || status === 'FAILED'

            if (wasCompleted && isNowReversed && payment.invoiceId) {
                const invoice = await tx.invoice.findUnique({ where: { id: payment.invoiceId } })
                if (invoice) {
                    const refundAmount = Number(existingPayment.amount)
                    const newPaidAmount = Math.max(0, Number(invoice.paidAmount) - refundAmount)
                    const newBalance = Math.min(Number(invoice.totalAmount), Number(invoice.balance) + refundAmount)
                    const newStatus = newPaidAmount <= 0
                        ? 'PENDING'
                        : newBalance <= 0 ? 'PAID' : 'PARTIALLY_PAID'

                    await tx.invoice.update({
                        where: { id: payment.invoiceId },
                        data: {
                            paidAmount: newPaidAmount,
                            balance: newBalance,
                            status: newStatus
                        }
                    })
                }
            }

            return payment
        })

        // Audit log
        await prisma.auditLog.create({
            data: {
                action: `PAYMENT_STATUS_CHANGED_TO_${status}`,
                entityType: 'Payment',
                entityId: id,
                userId: session.user.id,
                schoolId: existingPayment.schoolId,
                details: JSON.stringify({ previousStatus: existingPayment.status, newStatus: status, notes })
            }
        })

        return NextResponse.json(updatedPayment)
    } catch (error: any) {
        console.error('Failed to update payment:', error)
        return new NextResponse(error.message || 'Internal Server Error', { status: 500 })
    }
}
