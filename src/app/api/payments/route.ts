import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
    const session = await getServerSession(authOptions)

    if (!session) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const schoolId = searchParams.get('schoolId')
    const studentId = searchParams.get('studentId')
    const status = searchParams.get('status')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    // Build query filter
    const where: any = {}

    // Role-based restrictions
    if (session.user.role === 'PRINCIPAL' || session.user.role === 'FINANCE_MANAGER') {
        where.schoolId = session.user.schoolId
    } else if (session.user.role === 'PARENT') {
        // Parents only see payments for their students
        const guardianships = await prisma.studentGuardian.findMany({
            where: { userId: session.user.id },
            select: { studentId: true }
        })
        const studentIds = guardianships.map(g => g.studentId)
        where.studentId = { in: studentIds }
    } else if (session.user.role === 'SUPER_ADMIN') {
        // Super Admin can filter by school
        if (schoolId) where.schoolId = schoolId
    } else {
        return new NextResponse('Forbidden', { status: 403 })
    }

    // Additional filters
    if (studentId) where.studentId = studentId
    if (status) where.status = status
    if (dateFrom || dateTo) {
        where.createdAt = {}
        if (dateFrom) where.createdAt.gte = new Date(dateFrom)
        if (dateTo) where.createdAt.lte = new Date(dateTo)
    }

    try {
        const payments = await prisma.payment.findMany({
            where,
            include: {
                student: {
                    select: {
                        firstName: true,
                        lastName: true,
                        admissionNumber: true,
                        class: { select: { name: true, stream: true } }
                    }
                },
                school: {
                    select: {
                        name: true,
                        logoUrl: true,
                        primaryColor: true,
                        secondaryColor: true,
                        tagline: true,
                        mpesaPaybill: true,
                        bankName: true,
                        bankAccount: true,
                        bankAccountName: true,
                        bankBranch: true
                    }
                },
                invoice: {
                    select: {
                        invoiceNumber: true,
                        totalAmount: true,
                        paidAmount: true,
                        balance: true,
                        items: {
                            where: { isDismissed: false },
                            select: {
                                description: true,
                                amount: true,
                                category: true,
                                quantity: true,
                                unitPrice: true
                            },
                            orderBy: { category: 'asc' }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        return NextResponse.json(payments)
    } catch (error) {
        console.error('Failed to fetch payments:', error)
        return new NextResponse('Internal Server Error', { status: 500 })
    }
}
export async function POST(req: Request) {
    const session = await getServerSession(authOptions)

    if (!session || ((session.user.role !== 'PRINCIPAL' && session.user.role !== 'FINANCE_MANAGER') && session.user.role !== 'SUPER_ADMIN')) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    try {
        const body = await req.json()
        const { studentId, amount, method, description, transactionRef, date } = body

        if (!studentId || !amount || !method) {
            return new NextResponse('Missing required fields', { status: 400 })
        }

        let schoolId: string | null = session.user.schoolId || null

        if (!schoolId && session.user.role === 'SUPER_ADMIN') {
            const student = await prisma.student.findUnique({
                where: { id: studentId },
                select: { schoolId: true }
            })
            schoolId = student?.schoolId || null
        }

        if (!schoolId) {
            return new NextResponse('School context missing', { status: 400 })
        }

        const paymentAmount = parseFloat(amount)

        // Generate receipt number (Manual/Serial)
        const count = await prisma.payment.count({ where: { schoolId } })
        const receiptNumber = `RCP-${(count + 1).toString().padStart(5, '0')}`

        const payment = await prisma.$transaction(async (tx) => {
            // 1. Create the payment record
            const newPayment = await tx.payment.create({
                data: {
                    amount: paymentAmount,
                    method: method,
                    status: 'COMPLETED',
                    schoolId: schoolId,
                    studentId: studentId,
                    transactionRef: transactionRef || `MANUAL-${Date.now()}`,
                    receiptNumber: receiptNumber,
                    notes: description || `Manual ${method} payment`,
                    completedAt: date ? new Date(date) : new Date()
                }
            })

            // 2. Allocate payment to pending invoices (Oldest first)
            const pendingInvoices = await tx.invoice.findMany({
                where: {
                    studentId,
                    status: { in: ['PENDING', 'PARTIALLY_PAID'] }
                },
                orderBy: { createdAt: 'asc' }
            })

            let remainingAmount = paymentAmount
            for (const invoice of pendingInvoices) {
                if (remainingAmount <= 0) break

                const amountToApply = Math.min(remainingAmount, Number(invoice.balance))
                const newBalance = Number(invoice.balance) - amountToApply
                const newPaidAmount = Number(invoice.paidAmount) + amountToApply
                const newStatus = newBalance <= 0 ? 'PAID' : 'PARTIALLY_PAID'

                await tx.invoice.update({
                    where: { id: invoice.id },
                    data: {
                        paidAmount: newPaidAmount,
                        balance: newBalance,
                        status: newStatus
                    }
                })

                remainingAmount -= amountToApply
            }

            return newPayment
        })

        // 3. Trigger notification
        try {
            const { CommunicationEngine } = await import('@/lib/communication')
            CommunicationEngine.notifyPaymentReceived(payment.id)
        } catch (err) {
            console.error("Payment Notification Error:", err)
        }

        return NextResponse.json(payment)
    } catch (error: any) {
        console.error('Failed to record manual payment:', error)
        return new NextResponse(error.message || 'Internal Server Error', { status: 500 })
    }
}
