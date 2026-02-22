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
                growth: '0%'   // placeholder — extend later if needed
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

            const [myChildren, balanceAgg, paidThisTermAgg] = await Promise.all([
                Promise.resolve(studentIds.length),
                prisma.invoice.aggregate({
                    where: { studentId: { in: studentIds }, status: { notIn: ['PAID'] } },
                    _sum: { balance: true }
                }),
                prisma.payment.aggregate({
                    where: {
                        studentId: { in: studentIds },
                        status: 'COMPLETED',
                        createdAt: {
                            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                        }
                    },
                    _sum: { amount: true }
                })
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
                paidThisTerm: Number(paidThisTermAgg._sum.amount || 0),
                nextPayment: nextInvoice?.dueDate
                    ? new Date(nextInvoice.dueDate).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })
                    : 'N/A',
                hasActivePlan: activeCommitments.length > 0,
                commitmentVolume
            })
        }

        return new NextResponse('Unauthorized', { status: 401 })

    } catch (error) {
        console.error('Stats Error:', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
