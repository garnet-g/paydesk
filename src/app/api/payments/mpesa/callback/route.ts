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
            const amount = metadata.find((i: any) => i.Name === 'Amount')?.Value
            const mpesaReceipt = metadata.find((i: any) => i.Name === 'MpesaReceiptNumber')?.Value
            const phoneNumber = metadata.find((i: any) => i.Name === 'PhoneNumber')?.Value

            const payment = await prisma.payment.findFirst({
                where: { transactionRef: CheckoutRequestID }
            })

            if (payment) {
                await prisma.$transaction([
                    prisma.payment.update({
                        where: { id: payment.id },
                        data: {
                            status: 'COMPLETED',
                            receiptNumber: mpesaReceipt,
                            completedAt: new Date(),
                        }
                    }),
                    // If there's an invoice, update it
                    ...(payment.invoiceId ? [
                        prisma.invoice.update({
                            where: { id: payment.invoiceId },
                            data: {
                                paidAmount: { increment: amount },
                                balance: { decrement: amount },
                                status: {
                                    set: 'PAID' // Will be refined in the logic below
                                }
                            }
                        })
                    ] : [])
                ])

                // Update invoice status logic
                if (payment.invoiceId) {
                    const inv = await prisma.invoice.findUnique({
                        where: { id: payment.invoiceId }
                    })
                    if (inv && Number(inv.balance) <= 0) {
                        await prisma.invoice.update({
                            where: { id: payment.invoiceId },
                            data: { status: 'PAID', balance: 0 }
                        })
                    } else if (inv && Number(inv.balance) > 0) {
                        await prisma.invoice.update({
                            where: { id: payment.invoiceId },
                            data: { status: 'PARTIALLY_PAID' }
                        })
                    }
                }

                // [MVP Phase 2] Trigger automatic receipt notification
                try {
                    const { CommunicationEngine } = await import('@/lib/communication')
                    await CommunicationEngine.notifyPaymentReceived(payment.id)
                } catch (commError) {
                    console.error("Communication Trigger Error:", commError)
                }
            }
        } else {
            // Payment failed
            await prisma.payment.updateMany({
                where: { transactionRef: CheckoutRequestID },
                data: {
                    status: 'FAILED',
                    // resultDesc: ResultDesc
                }
            })
        }

        return NextResponse.json({ ResultCode: 0, ResultDesc: "Success" })
    } catch (error) {
        console.error("M-Pesa Callback Error:", error)
        return NextResponse.json({ ResultCode: 1, ResultDesc: "Internal Server Error" })
    }
}
