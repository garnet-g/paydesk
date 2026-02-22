import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'PRINCIPAL' && session.user.role !== 'SUPER_ADMIN')) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type')
    const schoolId = session.user.role === 'SUPER_ADMIN' ? searchParams.get('schoolId') : session.user.schoolId

    if (!schoolId && session.user.role !== 'SUPER_ADMIN') {
        return new NextResponse('School ID required', { status: 400 })
    }

    try {
        if (type === 'fee-summary') {
            const students = await prisma.student.findMany({
                where: schoolId ? { schoolId } : {},
                include: {
                    invoices: {
                        select: {
                            totalAmount: true,
                            paidAmount: true,
                            balance: true,
                        }
                    },
                    class: true
                }
            })

            const summary = students.map(s => {
                const totals = s.invoices.reduce((acc, inv) => ({
                    total: acc.total + Number(inv.totalAmount),
                    paid: acc.paid + Number(inv.paidAmount),
                    balance: acc.balance + Number(inv.balance),
                }), { total: 0, paid: 0, balance: 0 })

                return {
                    'Admission No': s.admissionNumber,
                    'Student Name': `${s.firstName} ${s.lastName}`,
                    'Class': `${s.class?.name || ''} ${s.class?.stream || ''}`,
                    'Total Invoiced': totals.total,
                    'Total Paid': totals.paid,
                    'Balance': totals.balance,
                    'Status': s.status
                }
            })

            return NextResponse.json(summary)
        }

        if (type === 'defaulters') {
            const threshold = parseFloat(searchParams.get('threshold') || '1')

            const defaulters = await prisma.student.findMany({
                where: {
                    schoolId: schoolId || undefined,
                    invoices: {
                        some: {
                            balance: { gt: threshold }
                        }
                    }
                },
                include: {
                    invoices: {
                        where: { balance: { gt: 0 } },
                        select: {
                            invoiceNumber: true,
                            balance: true,
                            dueDate: true
                        }
                    },
                    guardians: {
                        include: { user: true }
                    },
                    class: true
                }
            })

            const report = defaulters.map(d => ({
                'Student': `${d.firstName} ${d.lastName}`,
                'Adm No': d.admissionNumber,
                'Class': d.class?.name,
                'Balance': d.invoices.reduce((sum, inv) => sum + Number(inv.balance), 0),
                'Parent Name': d.guardians[0]?.user.firstName + ' ' + d.guardians[0]?.user.lastName,
                'Parent Phone': d.guardians[0]?.user.phoneNumber,
                'Last Invoice': d.invoices[0]?.invoiceNumber
            }))

            return NextResponse.json(report)
        }

        return new NextResponse('Invalid report type', { status: 400 })
    } catch (error: any) {
        console.error('Report generation error:', error)
        return new NextResponse(error.message || 'Internal Server Error', { status: 500 })
    }
}
