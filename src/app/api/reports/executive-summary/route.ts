import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'PRINCIPAL' && session.user.role !== 'FINANCE_MANAGER') || !session.user.schoolId) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    const schoolId = session.user.schoolId as string

    try {
        const today = new Date()

        // 1. Fetch all non-paid invoices for aging and collection rate
        const [allInvoices, completedPaymentsAgg] = await Promise.all([
            prisma.invoice.findMany({
                where: { schoolId },
                select: {
                    totalAmount: true,
                    paidAmount: true,
                    balance: true,
                    dueDate: true,
                    status: true,
                    createdAt: true
                }
            }),
            prisma.payment.aggregate({
                where: { schoolId, status: 'COMPLETED' },
                _sum: { amount: true }
            })
        ])

        // 2. Collection Rate Calculations
        const totalInvoiced = allInvoices.reduce((acc, inv) => acc + Number(inv.totalAmount), 0)
        const totalPaid = Number(completedPaymentsAgg._sum?.amount || 0)
        const collectionRate = totalInvoiced > 0 ? (totalPaid / totalInvoiced) * 100 : 0

        // 3. Aging Report
        const aging = {
            current: 0,   // 0-30 days overdue or not yet due
            thirty: 0,    // 31-60 days
            sixty: 0,     // 61-90 days
            ninetyPlus: 0 // 90+ days
        }

        allInvoices.forEach(inv => {
            if (Number(inv.balance) <= 0) return

            const dueDate = inv.dueDate ? new Date(inv.dueDate) : new Date(inv.createdAt)
            const diffTime = today.getTime() - dueDate.getTime()
            const diffDays = Math.floor(diffTime / (1000 * 3600 * 24))

            if (diffDays <= 30) aging.current += Number(inv.balance)
            else if (diffDays <= 60) aging.thirty += Number(inv.balance)
            else if (diffDays <= 90) aging.sixty += Number(inv.balance)
            else aging.ninetyPlus += Number(inv.balance)
        })

        // 4. Revenue Forecasting (Projected collections for next 60 days)
        const next30Days = new Date(today)
        next30Days.setDate(today.getDate() + 30)

        const next60Days = new Date(today)
        next60Days.setDate(today.getDate() + 60)

        const forecast30Agg = await prisma.invoice.aggregate({
            where: {
                schoolId,
                status: { not: 'PAID' },
                dueDate: { gte: today, lte: next30Days }
            },
            _sum: { balance: true }
        })

        const forecast60Agg = await prisma.invoice.aggregate({
            where: {
                schoolId,
                status: { not: 'PAID' },
                dueDate: { gte: next30Days, lte: next60Days }
            },
            _sum: { balance: true }
        })

        // 5. Performance by Class
        const classes = await prisma.class.findMany({
            where: { schoolId },
            include: {
                students: {
                    select: {
                        invoices: {
                            select: {
                                totalAmount: true,
                                balance: true
                            }
                        }
                    }
                }
            }
        })

        const classPerformance = classes.map(c => {
            let totalBilled = 0
            let totalBalance = 0

            c.students.forEach(s => {
                s.invoices.forEach(inv => {
                    totalBilled += Number(inv.totalAmount)
                    totalBalance += Number(inv.balance)
                })
            })

            const collected = totalBilled - totalBalance
            const rate = totalBilled > 0 ? (collected / totalBilled) * 100 : 0

            return {
                id: c.id,
                name: c.name,
                stream: c.stream,
                rate: rate.toFixed(1),
                outstanding: totalBalance
            }
        }).sort((a, b) => Number(b.rate) - Number(a.rate))

        return NextResponse.json({
            collectionRate: collectionRate.toFixed(1),
            totalInvoiced,
            totalPaid,
            aging,
            forecast: {
                next30: Number(forecast30Agg._sum?.balance || 0),
                next60: Number(forecast60Agg._sum?.balance || 0)
            },
            classPerformance: classPerformance.slice(0, 5) // Top 5 classes
        })

    } catch (error) {
        console.error('Executive Report Error:', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
