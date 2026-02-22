
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { CommunicationEngine } from '@/lib/communication'

export async function POST() {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'PRINCIPAL' && session.user.role !== 'SUPER_ADMIN')) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    const schoolId = session.user.schoolId

    try {
        const today = new Date()
        const overdueInvoices = await prisma.invoice.findMany({
            where: {
                schoolId: schoolId || undefined, // If super admin, could be all, but usually school specific
                status: { in: ['PENDING', 'PARTIALLY_PAID'] },
                dueDate: { lt: today }
            },
            include: {
                student: { include: { guardians: { include: { user: true } } } },
                school: true
            }
        })

        if (overdueInvoices.length === 0) {
            return NextResponse.json({ message: 'No overdue invoices found to remind.' })
        }

        // Processing reminders
        let sentCount = 0
        for (const invoice of overdueInvoices) {
            const message = `REMINDER: Invoice ${invoice.invoiceNumber} for ${invoice.student.firstName} is overdue. Balance: KES ${invoice.balance.toLocaleString()}. Please clear as soon as possible. - ${invoice.school.name}`

            for (const g of invoice.student.guardians) {
                if (g.user.phoneNumber) {
                    await CommunicationEngine.sendSMS({
                        to: g.user.phoneNumber,
                        message,
                        studentId: invoice.studentId,
                        schoolId: invoice.schoolId
                    })
                    sentCount++
                }
            }
        }

        return NextResponse.json({
            message: `Successfully sent ${sentCount} reminders for ${overdueInvoices.length} invoices.`
        })

    } catch (error: any) {
        console.error('Reminder Error:', error)
        return NextResponse.json({ error: error.message || 'Internal Error' }, { status: 500 })
    }
}
