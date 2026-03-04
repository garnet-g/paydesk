import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * M-Pesa C2B Confirmation Webhook
 * Safaricom calls this after a successful payment via Paybill
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

        // ── Fix #3: Idempotency — reject duplicate TransIDs ─────────────────────
        const existingPayment = await prisma.payment.findFirst({
            where: { transactionRef: TransID }
        })
        if (existingPayment) {
            console.warn(`[C2B] Duplicate TransID ${TransID} ignored`)
            return NextResponse.json({ ResultCode: 0, ResultDesc: "Success" })
        }

        // ── Fix #13: Identify school by BusinessShortCode instead of findFirst ──
        // Find which school this payment belongs to based on their registered shortcode
        const school = await prisma.school.findFirst({
            where: { mpesaShortcode: BusinessShortCode?.toString() }
        })

        // 1. Match by invoice number
        const invoice = await prisma.invoice.findFirst({
            where: {
                invoiceNumber: { equals: BillRefNumber.trim(), mode: 'insensitive' },
                ...(school ? { schoolId: school.id } : {})
            },
            include: { student: true }
        })

        if (invoice) {
            await reconcilePayment(invoice.id, invoice.studentId, invoice.schoolId, TransID, amount, payerName, payerPhone)
            return NextResponse.json({ ResultCode: 0, ResultDesc: "Success" })
        }

        // 2. Match by student admission number
        const student = await prisma.student.findFirst({
            where: {
                admissionNumber: { equals: BillRefNumber.trim(), mode: 'insensitive' },
                ...(school ? { schoolId: school.id } : {})
            },
            include: {
                invoices: {
                    where: { status: { not: 'PAID' } },
                    orderBy: { createdAt: 'asc' }
                }
            }
        })

        if (student) {
            const targetInvoice = student.invoices[0]
            await reconcilePayment(targetInvoice?.id || null, student.id, student.schoolId, TransID, amount, payerName, payerPhone)
            return NextResponse.json({ ResultCode: 0, ResultDesc: "Success" })
        }

        // ── Fix #4: Fallback unmatched payment — use nullable studentId ──────────
        // Use the school matched by shortcode; if still not found log a warning
        if (!school) {
            console.warn(`[C2B] No school found for shortcode: ${BusinessShortCode}. Payment ${TransID} stored as global unreconciled.`)
        }

        await prisma.payment.create({
            data: {
                transactionRef: TransID,
                amount: amount,
                method: 'MPESA_C2B',
                status: 'COMPLETED',
                payerName: payerName,
                payerPhone: payerPhone,
                receiptNumber: TransID,
                schoolId: school?.id,        // undefined if no school matched — Prisma will omit it
                notes: `Unreconciled C2B Payment. BillRef: ${BillRefNumber}. Shortcode: ${BusinessShortCode}`,
                completedAt: new Date(),
            } as any   // schoolId and studentId are optional nullable FK fields
        })

        return NextResponse.json({ ResultCode: 0, ResultDesc: "Success" })

    } catch (error) {
        console.error("M-Pesa C2B Confirmation Error:", error)
        return NextResponse.json({ ResultCode: 1, ResultDesc: "Internal Server Error" })
    }
}

async function reconcilePayment(
    invoiceId: string | null,
    studentId: string,
    schoolId: string,
    transId: string,
    amount: number,
    name: string,
    phone: string
) {
    return await prisma.$transaction(async (tx) => {
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

        // ── Fix #2: Safe invoice update — no negative balances ───────────────────
        if (invoiceId) {
            const invoice = await tx.invoice.findUnique({ where: { id: invoiceId } })
            if (invoice) {
                const newPaidAmount = Number(invoice.paidAmount) + amount
                const newBalance = Math.max(0, Number(invoice.balance) - amount)

                await tx.invoice.update({
                    where: { id: invoiceId },
                    data: {
                        paidAmount: newPaidAmount,
                        balance: newBalance,
                        status: newBalance <= 0 ? 'PAID' : 'PARTIALLY_PAID'
                    }
                })
            }
        }

        // Notify parent
        try {
            const { CommunicationEngine } = await import('@/lib/communication')
            await CommunicationEngine.notifyPaymentReceived(payment.id)
        } catch (commError) {
            console.error("Communication Trigger Error:", commError)
        }

        return payment
    })
}
