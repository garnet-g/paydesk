import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * M-Pesa C2B Confirmation Webhook
 * Safaricom calls this after a successful payment
 */
export async function POST(req: Request) {
    try {
        const body = await req.json()
        console.log("M-Pesa C2B Confirmation:", JSON.stringify(body, null, 2))

        const {
            TransactionType,
            TransID,
            TransTime,
            TransAmount,
            BusinessShortCode,
            BillRefNumber,
            InvoiceNumber,
            OrgAccountBalance,
            ThirdPartyTransID,
            MSISDN,
            FirstName,
            MiddleName,
            LastName
        } = body

        const amount = parseFloat(TransAmount)
        const payerName = `${FirstName || ''} ${MiddleName || ''} ${LastName || ''}`.trim()
        const payerPhone = MSISDN

        // Logic for reconciliation
        // 1. Check if it's an invoice match
        const invoice = await prisma.invoice.findFirst({
            where: {
                invoiceNumber: {
                    equals: BillRefNumber.trim(),
                    mode: 'insensitive'
                }
            },
            include: { student: true }
        })

        if (invoice) {
            await reconcilePayment(invoice.id, invoice.studentId, invoice.schoolId, TransID, amount, payerName, payerPhone)
            return NextResponse.json({ ResultCode: 0, ResultDesc: "Success" })
        }

        // 2. Check if it's a student match
        const student = await prisma.student.findFirst({
            where: {
                admissionNumber: {
                    equals: BillRefNumber.trim(),
                    mode: 'insensitive'
                }
            },
            include: {
                invoices: {
                    where: { status: { not: 'PAID' } },
                    orderBy: { createdAt: 'asc' }
                }
            }
        })

        if (student) {
            // Apply to the oldest pending invoice first
            const targetInvoice = student.invoices[0]
            await reconcilePayment(targetInvoice?.id || null, student.id, student.schoolId, TransID, amount, payerName, payerPhone)
            return NextResponse.json({ ResultCode: 0, ResultDesc: "Success" })
        }

        // 3. Fallback: Create unassigned payment for manual reconciliation
        // We'll need to find the school by ShortCode if multiple schools use the same system,
        // but for now we assume one school or use default
        const defaultSchool = await prisma.school.findFirst()

        await prisma.payment.create({
            data: {
                transactionRef: TransID,
                amount: amount,
                method: 'MPESA_C2B',
                status: 'COMPLETED',
                payerName: payerName,
                payerPhone: payerPhone,
                receiptNumber: TransID,
                notes: `Unmatched C2B Payment. BillRef: ${BillRefNumber}`,
                schoolId: defaultSchool?.id || 'GLOBAL',
                studentId: 'UNASSIGNED', // We should probably have a better way for this
                completedAt: new Date(),
            }
        })

        return NextResponse.json({ ResultCode: 0, ResultDesc: "Success" })

    } catch (error) {
        console.error("M-Pesa C2B Confirmation Error:", error)
        return NextResponse.json({ ResultCode: 1, ResultDesc: "Internal Server Error" })
    }
}

async function reconcilePayment(invoiceId: string | null, studentId: string, schoolId: string, transId: string, amount: number, name: string, phone: string) {
    return await prisma.$transaction(async (tx) => {
        // Create the payment record
        const payment = await tx.payment.create({
            data: {
                transactionRef: transId,
                amount: amount,
                method: 'MPESA_C2B',
                status: 'COMPLETED',
                payerName: name,
                payerPhone: phone,
                receiptNumber: transId,
                schoolId: schoolId,
                studentId: studentId,
                invoiceId: invoiceId,
                completedAt: new Date(),
            }
        })

        // If matched to an invoice, update balance and status
        if (invoiceId) {
            const invoice = await tx.invoice.findUnique({ where: { id: invoiceId } })
            if (invoice) {
                const newPaidAmount = Number(invoice.paidAmount) + amount
                const newBalance = Number(invoice.totalAmount) - newPaidAmount

                await tx.invoice.update({
                    where: { id: invoiceId },
                    data: {
                        paidAmount: newPaidAmount,
                        balance: Math.max(0, newBalance),
                        status: newBalance <= 0 ? 'PAID' : 'PARTIALLY_PAID'
                    }
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

        return payment
    })
}
