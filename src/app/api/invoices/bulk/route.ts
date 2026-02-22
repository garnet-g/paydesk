import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)

    if (!session || ((session.user.role !== 'PRINCIPAL' && session.user.role !== 'FINANCE_MANAGER') && session.user.role !== 'SUPER_ADMIN')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const body = await req.json()
        const {
            classId,
            academicPeriodId,
            dueDate,
            feeStructureIds,
            invoiceTitle // e.g. "Term 1 2026 Fees"
        } = body

        if (!academicPeriodId || !dueDate) {
            return NextResponse.json({ error: 'Academic period and due date are required' }, { status: 400 })
        }

        const schoolId = session.user.schoolId as string
        if (!schoolId && session.user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'School ID not found in session' }, { status: 400 })
        }

        // 1. Fetch Academic Period
        const period = await prisma.academicPeriod.findUnique({
            where: { id: academicPeriodId }
        })

        if (!period) {
            return NextResponse.json({ error: 'Academic period not found' }, { status: 404 })
        }

        // 2. Fetch Students
        const studentWhere: any = {
            schoolId: schoolId,
            status: 'ACTIVE'
        }
        if (classId) {
            studentWhere.classId = classId
        }

        const students = await prisma.student.findMany({
            where: studentWhere,
            include: { class: true }
        })

        if (students.length === 0) {
            return NextResponse.json({ error: 'No active students found matching criteria' }, { status: 404 })
        }

        // 3. Fetch Fee Structures
        let feeStructures;
        if (feeStructureIds && feeStructureIds.length > 0) {
            feeStructures = await prisma.feeStructure.findMany({
                where: {
                    id: { in: feeStructureIds },
                    schoolId: schoolId
                }
            })
        } else {
            // Default: Fetch all active structures for this period
            feeStructures = await prisma.feeStructure.findMany({
                where: {
                    academicPeriodId: academicPeriodId,
                    schoolId: schoolId,
                    isActive: true
                }
            })
        }

        if (feeStructures.length === 0) {
            return NextResponse.json({ error: 'No applicable fee structures found' }, { status: 400 })
        }

        let createdCount = 0
        let skippedCount = 0
        const newlyCreatedIds: string[] = []

        // 4. Batch Generate Invoices
        // We use a simple loop here for reliability, but could be optimized
        for (const student of students) {
            // Check for existing invoice for this period
            const existing = await prisma.invoice.findFirst({
                where: {
                    studentId: student.id,
                    academicPeriodId: academicPeriodId
                }
            })

            if (existing) {
                skippedCount++
                continue
            }

            // Filter fee structures applicable to this student
            // (either class-specific or general)
            const applicableFS = feeStructures.filter(fs => !fs.classId || fs.classId === student.classId)

            if (applicableFS.length === 0) {
                skippedCount++
                continue
            }

            const totalAmount = applicableFS.reduce((sum, fs) => sum + fs.amount, 0)

            // Deterministic invoice number: period year + term + admNo (no collisions)
            const invoiceNumber = `INV-${period.academicYear}-${period.term}-${student.admissionNumber}`

            const newInvoice = await prisma.invoice.create({
                data: {
                    invoiceNumber,
                    totalAmount,
                    paidAmount: 0,
                    balance: totalAmount,
                    status: 'PENDING',
                    schoolId: schoolId,
                    studentId: student.id,
                    academicPeriodId: academicPeriodId,
                    dueDate: dueDate ? new Date(dueDate) : period.endDate,
                    feeStructureId: applicableFS[0].id,
                    items: {
                        create: applicableFS.map(fs => ({
                            description: fs.name,
                            amount: fs.amount,
                            category: fs.category || 'OTHER',
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

        // 5. Audit Log
        await prisma.auditLog.create({
            data: {
                action: 'BULK_INVOICE_GENERATED',
                entityType: 'Invoice',
                userId: session.user.id,
                schoolId: schoolId,
                details: JSON.stringify({
                    classId,
                    academicPeriodId,
                    count: createdCount,
                    skipped: skippedCount
                })
            }
        })

        return NextResponse.json({
            success: true,
            message: `Successfully generated ${createdCount} invoices. ${skippedCount} students were skipped (already invoiced or no matching fees).`,
            createdCount,
            skippedCount
        })

    } catch (error: any) {
        console.error('Bulk generation error:', error)
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}
