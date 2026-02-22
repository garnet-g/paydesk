import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
    const session = await getServerSession(authOptions)

    if (!session || ((session.user.role !== 'PRINCIPAL' && session.user.role !== 'FINANCE_MANAGER') && session.user.role !== 'SUPER_ADMIN')) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    try {
        const schoolId = session.user.schoolId

        // Fetch students with outstanding invoices
        const students = await prisma.student.findMany({
            where: {
                schoolId: schoolId!,
                invoices: {
                    some: {
                        balance: { gt: 0 }
                    }
                }
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                admissionNumber: true,
                class: {
                    select: {
                        name: true,
                        stream: true
                    }
                },
                invoices: {
                    where: {
                        balance: { gt: 0 }
                    },
                    select: {
                        balance: true,
                        dueDate: true
                    }
                },
                guardians: {
                    where: { isPrimary: true },
                    include: {
                        user: {
                            select: {
                                email: true,
                                phoneNumber: true
                            }
                        }
                    }
                }
            }
        })

        // Process and aggregate data
        const defaulters = students.map(student => {
            const totalDue = student.invoices.reduce((sum, inv) => sum + Number(inv.balance), 0)
            const overdueAmount = student.invoices
                .filter(inv => inv.dueDate && new Date(inv.dueDate) < new Date())
                .reduce((sum, inv) => sum + Number(inv.balance), 0)

            return {
                id: student.id,
                name: `${student.firstName} ${student.lastName}`,
                admissionNumber: student.admissionNumber,
                className: student.class ? `${student.class.name} ${student.class.stream || ''}` : 'No Class',
                totalDue,
                overdueAmount,
                parentContact: student.guardians[0]?.user.phoneNumber || student.guardians[0]?.user.email || 'N/A'
            }
        })
            .sort((a, b) => b.totalDue - a.totalDue) // Sort by highest debt

        return NextResponse.json(defaulters)
    } catch (error) {
        console.error('Failed to fetch defaulters:', error)
        return new NextResponse('Internal Server Error', { status: 500 })
    }
}
