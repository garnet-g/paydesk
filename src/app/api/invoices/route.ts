import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
    const session = await getServerSession(authOptions)

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { role, schoolId, id: userId } = session.user

    try {
        let where: any = {}

        if (role === 'PRINCIPAL' || role === 'FINANCE_MANAGER') {
            where.schoolId = schoolId
        } else if (role === 'PARENT') {
            where.student = {
                guardians: {
                    some: { userId }
                }
            }
        }
        // SUPER_ADMIN: no filter — sees all

        const invoices = await prisma.invoice.findMany({
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
                        tagline: true
                    }
                },
                academicPeriod: true,
                items: {
                    where: { isDismissed: false },
                    orderBy: { category: 'asc' }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json(invoices)
    } catch (error: any) {
        console.error('Failed to fetch invoices:', error)
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'PRINCIPAL' && session.user.role !== 'FINANCE_MANAGER')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { schoolId } = session.user

        const academicPeriod = await prisma.academicPeriod.findFirst({
            where: { schoolId: schoolId as string, isActive: true }
        })

        if (!academicPeriod) {
            return NextResponse.json({ error: 'No active academic period found. Please activate a term first.' }, { status: 400 })
        }

        const feeStructures = await prisma.feeStructure.findMany({
            where: { schoolId: schoolId as string, academicPeriodId: academicPeriod.id, isActive: true }
        })

        if (feeStructures.length === 0) {
            return NextResponse.json({ error: 'No active fee structures found for this period. Please define fees first.' }, { status: 400 })
        }

        const students = await prisma.student.findMany({
            where: { schoolId: schoolId as string, status: 'ACTIVE' }
        })

        if (students.length === 0) {
            return NextResponse.json({ error: 'No active students found.' }, { status: 400 })
        }

        let createdCount = 0
        let skippedCount = 0
        const newlyCreatedIds: string[] = []

        for (const student of students) {
            const existingInvoice = await prisma.invoice.findFirst({
                where: { studentId: student.id, academicPeriodId: academicPeriod.id }
            })

            if (existingInvoice) {
                skippedCount++
                continue
            }

            const applicableFS = feeStructures.filter(fs => !fs.classId || fs.classId === student.classId)
            const totalAmount = applicableFS.reduce((sum, fs) => sum + fs.amount, 0)

            if (totalAmount <= 0 || applicableFS.length === 0) {
                skippedCount++
                continue
            }

            // Unique invoice number: use period year+term + admission number
            const invoiceNumber = `INV-${academicPeriod.academicYear}-${academicPeriod.term}-${student.admissionNumber}`

            const newInvoice = await prisma.invoice.create({
                data: {
                    invoiceNumber,
                    totalAmount,
                    paidAmount: 0,
                    balance: totalAmount,
                    status: 'PENDING',
                    schoolId: schoolId!,
                    studentId: student.id,
                    academicPeriodId: academicPeriod.id,
                    dueDate: academicPeriod.endDate,   // Due at end of term, not arbitrary 1 month
                    feeStructureId: applicableFS[0]?.id,
                    items: {
                        create: applicableFS.map(fs => ({
                            description: fs.name,
                            amount: fs.amount,
                            category: fs.category,
                            quantity: 1,
                            unitPrice: fs.amount,
                            feeStructureId: fs.id
                        }))
                    }
                }
            })
            newlyCreatedIds.push(newInvoice.id)
            createdCount++
        }

        // [MVP Phase 2] Trigger automatic notifications for new invoices
        if (newlyCreatedIds.length > 0) {
            try {
                const { CommunicationEngine } = await import('@/lib/communication')
                CommunicationEngine.notifyBulkInvoices(newlyCreatedIds)
            } catch (err) {
                console.error("Bulk Notification Trigger Error:", err)
            }
        }

        return NextResponse.json({
            success: true,
            message: `Generated ${createdCount} invoice${createdCount !== 1 ? 's' : ''}. ${skippedCount > 0 ? `${skippedCount} student${skippedCount !== 1 ? 's' : ''} skipped (already invoiced or no applicable fees).` : ''}`,
            createdCount,
            skippedCount
        })

    } catch (error: any) {
        console.error('Failed to generate invoices:', error)
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}
