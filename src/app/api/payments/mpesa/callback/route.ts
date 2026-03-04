import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
    try {
        const body = await req.json()
        console.log("M-Pesa Callback Status:", JSON.stringify(body, null, 2))

        const { ResultCode, ResultDesc, CheckoutRequestID, CallbackMetadata } = body.Body.stkCallback

        if (ResultCode === 0) {
            // Payment successful
            const metadata = CallbackMetadata.Item
            const amount = Number(metadata.find((i: any) => i.Name === 'Amount')?.Value ?? 0)
            const mpesaReceipt = metadata.find((i: any) => i.Name === 'MpesaReceiptNumber')?.Value
            const phoneNumber = metadata.find((i: any) => i.Name === 'PhoneNumber')?.Value

            const payment = await prisma.payment.findFirst({
                where: { transactionRef: CheckoutRequestID }
            })

            if (payment) {
                // ── Fix #3: Idempotency guard ────────────────────────────────────────
                // Safaricom retries callbacks on timeout. Only process PENDING payments.
                if (payment.status === 'COMPLETED') {
                    console.warn(`[Callback] Duplicate callback ignored for already-COMPLETED payment ${payment.id}`)
                    return NextResponse.json({ ResultCode: 0, ResultDesc: "Success" })
                }

                await prisma.$transaction(async (tx) => {
                    // Mark payment completed
                    await tx.payment.update({
                        where: { id: payment.id },
                        data: {
                            status: 'COMPLETED',
                            receiptNumber: mpesaReceipt,
                            completedAt: new Date(),
                        }
                    })

                    // ── Fix #2: Safe invoice update — no negative balances ────────────
                    if (payment.invoiceId) {
                        const inv = await tx.invoice.findUnique({ where: { id: payment.invoiceId } })
                        if (inv) {
                            const newPaidAmount = Number(inv.paidAmount) + amount
                            const newBalance = Math.max(0, Number(inv.balance) - amount)
                            const newStatus = newBalance <= 0 ? 'PAID' : 'PARTIALLY_PAID'

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
                })

                // Trigger notification outside transaction (non-fatal if it fails)
                try {
                    const { CommunicationEngine } = await import('@/lib/communication')
                    await CommunicationEngine.notifyPaymentReceived(payment.id)
                } catch (commError) {
                    console.error("Communication Trigger Error:", commError)
                }
            }
        } else {
            // Payment failed/cancelled
            await prisma.payment.updateMany({
                where: { transactionRef: CheckoutRequestID, status: 'PENDING' },
                data: { status: 'FAILED' }
            })
        }

        return NextResponse.json({ ResultCode: 0, ResultDesc: "Success" })
    } catch (error) {
        console.error("M-Pesa Callback Error:", error)
        return NextResponse.json({ ResultCode: 1, ResultDesc: "Internal Server Error" })
    }
}
