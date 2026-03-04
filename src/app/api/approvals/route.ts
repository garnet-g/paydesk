import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'PRINCIPAL' && session.user.role !== 'FINANCE_MANAGER')) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    const schoolId = session.user.schoolId as string

    try {
        const requests = await prisma.approvalRequest.findMany({
            where: { schoolId },
            include: {
                requestedBy: {
                    select: { firstName: true, lastName: true, role: true }
                },
                approvedBy: {
                    select: { firstName: true, lastName: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json(requests)
    } catch (error) {
        console.error('Approvals Fetch Error:', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'PRINCIPAL' && session.user.role !== 'FINANCE_MANAGER')) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    const { type, payload, reason } = await req.json()
    const { id: userId, schoolId } = session.user

    try {
        const request = await prisma.approvalRequest.create({
            data: {
                type,
                payload: JSON.stringify(payload),
                reason,
                requestedById: userId,
                schoolId: schoolId as string,
                status: 'PENDING'
            }
        })

        return NextResponse.json(request)
    } catch (error) {
        console.error('Approvals Create Error:', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}

// Approval Action (PATCH)
export async function PATCH(req: Request) {
    const session = await getServerSession(authOptions)
    // Only PRINCIPAL can approve (dual-authorization)
    if (!session || session.user.role !== 'PRINCIPAL') {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    const { requestId, action } = await req.json() // action: 'APPROVED' | 'REJECTED'
    const { id: userId } = session.user

    try {
        const request = await prisma.approvalRequest.findUnique({
            where: { id: requestId }
        })

        if (!request) {
            return new NextResponse('Request not found', { status: 404 })
        }

        // ── Fix #18: School ownership — principal can only approve own school's requests ─
        if (request.schoolId !== session.user.schoolId) {
            return new NextResponse('Forbidden: Cannot approve requests from another school', { status: 403 })
        }

        if (request.requestedById === userId) {
            return new NextResponse('Dual-authorization required: You cannot approve your own request', { status: 403 })
        }

        const updatedRequest = await prisma.$transaction(async (tx) => {
            const req = await tx.approvalRequest.update({
                where: { id: requestId },
                data: {
                    status: action,
                    approvedById: action === 'APPROVED' ? userId : null
                }
            })

            if (action === 'APPROVED') {
                const payload = JSON.parse(req.payload)

                // EXECUTE THE ACTUAL ACTION BASED ON TYPE
                if (req.type === 'INVOICE_CANCELLATION') {
                    await tx.invoice.update({
                        where: { id: payload.invoiceId },
                        data: { status: 'CANCELLED' }
                    })
                } else if (req.type === 'BALANCE_ADJUSTMENT') {
                    // ── Fix #9: Also update paidAmount and recalculate status ────────
                    const currentInvoice = await tx.invoice.findUnique({
                        where: { id: payload.invoiceId },
                        select: { totalAmount: true }
                    })
                    const newTotal = payload.newTotal ?? Number(currentInvoice?.totalAmount ?? 0)
                    const newBalance = payload.newBalance ?? 0
                    const impliedPaid = Math.max(0, newTotal - newBalance)
                    const newStatus = newBalance <= 0 ? 'PAID'
                        : impliedPaid > 0 ? 'PARTIALLY_PAID'
                            : 'PENDING'

                    await tx.invoice.update({
                        where: { id: payload.invoiceId },
                        data: {
                            balance: newBalance,
                            totalAmount: newTotal,
                            paidAmount: impliedPaid,
                            status: newStatus
                        }
                    })
                } else if (req.type === 'GRADE_PROMOTION') {
                    // --- GRADE PROMOTION EXECUTION ---
                    const studentIds: string[] = payload.studentIds
                    const fromClassId = payload.fromClassId
                    const toClassId = payload.toClassId
                    const academicYear = payload.academicYear
                    const term = payload.term

                    // 1. Update each student's class and create grade history
                    for (const studentId of studentIds) {
                        await tx.student.update({
                            where: { id: studentId },
                            data: { classId: toClassId }
                        })

                        await tx.gradeHistory.create({
                            data: {
                                studentId,
                                fromClassId,
                                toClassId,
                                academicYear,
                                term,
                                reason: 'PROMOTION',
                                notes: payload.notes || null,
                                promotedById: userId,
                                approvalId: requestId
                            }
                        })
                    }

                    // 2. Auto-generate invoices for the new class if an active period exists
                    if (payload.activePeriodId) {
                        const period = await tx.academicPeriod.findUnique({
                            where: { id: payload.activePeriodId }
                        })

                        if (period) {
                            const feeStructures = await tx.feeStructure.findMany({
                                where: {
                                    schoolId: req.schoolId,
                                    academicPeriodId: period.id,
                                    isActive: true,
                                    OR: [
                                        { classId: toClassId },
                                        { classId: null }
                                    ]
                                }
                            })

                            if (feeStructures.length > 0) {
                                for (const studentId of studentIds) {
                                    // Skip if student already has an invoice for this period
                                    const existingInvoice = await tx.invoice.findFirst({
                                        where: { studentId, academicPeriodId: period.id }
                                    })
                                    if (existingInvoice) continue

                                    const student = await tx.student.findUnique({
                                        where: { id: studentId },
                                        select: { admissionNumber: true }
                                    })
                                    if (!student) continue

                                    const applicableFS = feeStructures.filter(
                                        fs => !fs.classId || fs.classId === toClassId
                                    )
                                    if (applicableFS.length === 0) continue

                                    const totalAmount = applicableFS.reduce(
                                        (sum, fs) => sum + fs.amount, 0
                                    )
                                    const invoiceNumber = `INV-${period.academicYear}-${period.term}-${student.admissionNumber}`

                                    await tx.invoice.create({
                                        data: {
                                            invoiceNumber,
                                            totalAmount,
                                            paidAmount: 0,
                                            balance: totalAmount,
                                            status: 'PENDING',
                                            schoolId: req.schoolId,
                                            studentId,
                                            academicPeriodId: period.id,
                                            dueDate: period.endDate,
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
                                }
                            }
                        }
                    }

                    // 3. Audit log for execution
                    await tx.auditLog.create({
                        data: {
                            action: 'GRADE_PROMOTION_EXECUTED',
                            entityType: 'GradeHistory',
                            entityId: requestId,
                            userId,
                            schoolId: req.schoolId,
                            details: JSON.stringify({
                                fromClass: payload.fromClassName,
                                toClass: payload.toClassName,
                                studentCount: studentIds.length,
                                invoicesGenerated: payload.activePeriodId ? true : false
                            })
                        }
                    })
                }
                // (Extend for refunds, etc.)
            }

            return req
        })

        return NextResponse.json(updatedRequest)
    } catch (error) {
        console.error('Approval Process Error:', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
