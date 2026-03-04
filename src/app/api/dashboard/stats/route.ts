import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
    const session = await getServerSession(authOptions)
    if (!session) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    const { role, id: userId, schoolId } = session.user

    try {
        // ─── SUPER_ADMIN ────────────────────────────────────────────────────────
        if (role === 'SUPER_ADMIN') {
            const [totalSchools, totalStudents, collectionsAgg] = await Promise.all([
                prisma.school.count(),
                prisma.student.count(),
                prisma.payment.aggregate({
                    where: { status: 'COMPLETED' },
                    _sum: { amount: true }
                })
            ])

            return NextResponse.json({
                totalSchools,
                totalStudents,
                totalCollections: Number(collectionsAgg._sum.amount || 0),
                growth: '0%'
            }, {
                headers: { 'Cache-Control': 'private, max-age=60, stale-while-revalidate=120' }
            })
        }

        // ─── PRINCIPAL ───────────────────────────────────────────────────────────
        if (role === 'PRINCIPAL' || role === 'FINANCE_MANAGER') {
            const [totalStudents, collectionsAgg, balanceAgg, thisMonthAgg] = await Promise.all([
                prisma.student.count({ where: { schoolId: schoolId! } }),
                prisma.payment.aggregate({
                    where: { schoolId: schoolId!, status: 'COMPLETED' },
                    _sum: { amount: true }
                }),
                prisma.invoice.aggregate({
                    where: { schoolId: schoolId!, status: { notIn: ['PAID'] } },
                    _sum: { balance: true }
                }),
                prisma.payment.aggregate({
                    where: {
                        schoolId: schoolId!,
                        status: 'COMPLETED',
                        createdAt: {
                            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                        }
                    },
                    _sum: { amount: true }
                })
            ])

            const totalCollected = Number(collectionsAgg._sum.amount || 0)
            const totalOutstanding = Number(balanceAgg._sum.balance || 0)
            const totalExpected = totalCollected + totalOutstanding
            const collectionRate = totalExpected > 0
                ? Math.round((totalCollected / totalExpected) * 100)
                : 0

            return NextResponse.json({
                totalStudents,
                totalCollections: totalCollected,
                outstanding: `KES ${totalOutstanding.toLocaleString()}`,
                thisMonth: `KES ${Number(thisMonthAgg._sum.amount || 0).toLocaleString()}`,
                totalExpected: `KES ${totalExpected.toLocaleString()}`,
                collectionRate
            }, {
                headers: { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=60' }
            })
        }

        // ─── PARENT ──────────────────────────────────────────────────────────────
        if (role === 'PARENT') {
            // Count children linked to this parent via StudentGuardian
            const guardianships = await prisma.studentGuardian.findMany({
                where: { userId },
                select: { studentId: true }
            })
            const studentIds = guardianships.map(g => g.studentId)

            const [myChildren, balanceAgg, paidAgg] = await Promise.all([
                Promise.resolve(studentIds.length),

                // Total balance still owed across all unpaid invoices
                prisma.invoice.aggregate({
                    where: { studentId: { in: studentIds }, status: { notIn: ['PAID'] } },
                    _sum: { balance: true }
                }),

                // Total amount paid = sum of invoice.paidAmount across ALL invoices
                // This is the canonical value, always updated by every payment route
                // (M-Pesa callback, manual cheque, bank transfer etc.)
                // Do NOT use payment.aggregate with createdAt filter — that misses
                // backdated/manual payments and only covers the current calendar month.
                prisma.invoice.aggregate({
                    where: { studentId: { in: studentIds } },
                    _sum: { paidAmount: true }
                }),
            ])

            // Next due date: earliest unpaid invoice due date
            const nextInvoice = studentIds.length > 0
                ? await prisma.invoice.findFirst({
                    where: {
                        studentId: { in: studentIds },
                        status: { notIn: ['PAID'] },
                        dueDate: { gte: new Date() }
                    },
                    orderBy: { dueDate: 'asc' },
                    select: { dueDate: true }
                })
                : null

            // Fetch active commitments
            const activeCommitments = await prisma.paymentCommitment.findMany({
                where: { userId, status: 'ACTIVE' },
                select: { amount: true, frequency: true }
            })

            const commitmentVolume = activeCommitments.reduce((sum, c) => sum + Number(c.amount), 0)

            return NextResponse.json({
                myChildren,
                totalBalance: Number(balanceAgg._sum.balance || 0),
                paidThisTerm: Number(paidAgg._sum.paidAmount || 0),
                nextPayment: nextInvoice?.dueDate
                    ? new Date(nextInvoice.dueDate).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })
                    : 'N/A',
                hasActivePlan: activeCommitments.length > 0,
                commitmentVolume
            }, {
                // No cache for parent stats — must always reflect latest manual payments
                headers: { 'Cache-Control': 'private, no-store' }
            })
        }

        return new NextResponse('Unauthorized', { status: 401 })

    } catch (error) {
        console.error('Stats Error:', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
