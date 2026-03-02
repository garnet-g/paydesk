import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET: Preview promotion — list students in a class and available target classes
export async function GET(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'PRINCIPAL' && session.user.role !== 'FINANCE_MANAGER')) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const fromClassId = searchParams.get('fromClassId')
    const schoolId = session.user.schoolId as string

    try {
        // Get all classes for this school
        const classes = await prisma.class.findMany({
            where: { schoolId },
            orderBy: { name: 'asc' },
            include: {
                _count: { select: { students: { where: { status: 'ACTIVE' } } } }
            }
        })

        // If a source class is specified, also return the students in it
        let students: any[] = []
        let fromClass = null
        if (fromClassId) {
            fromClass = classes.find(c => c.id === fromClassId)
            students = await prisma.student.findMany({
                where: {
                    classId: fromClassId,
                    schoolId,
                    status: 'ACTIVE'
                },
                include: {
                    class: { select: { id: true, name: true, stream: true } }
                },
                orderBy: { firstName: 'asc' }
            })
        }

        // Get active academic period for fee preview
        const activePeriod = await prisma.academicPeriod.findFirst({
            where: { schoolId, isActive: true }
        })

        return NextResponse.json({
            classes,
            students,
            fromClass,
            activePeriod
        })
    } catch (error) {
        console.error('Grade Promotion Preview Error:', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}

// POST: Initiate a grade promotion request (creates an ApprovalRequest)
export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'PRINCIPAL' && session.user.role !== 'FINANCE_MANAGER')) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    try {
        const body = await req.json()
        const {
            fromClassId,
            toClassId,
            studentIds,     // optional: if not provided, promote all active students in class
            academicYear,
            term,
            notes
        } = body

        const schoolId = session.user.schoolId as string

        if (!fromClassId || !toClassId) {
            return NextResponse.json({ error: 'Source and target classes are required' }, { status: 400 })
        }

        if (fromClassId === toClassId) {
            return NextResponse.json({ error: 'Source and target classes must be different' }, { status: 400 })
        }

        // Validate both classes belong to this school
        const [fromClass, toClass] = await Promise.all([
            prisma.class.findFirst({ where: { id: fromClassId, schoolId } }),
            prisma.class.findFirst({ where: { id: toClassId, schoolId } })
        ])

        if (!fromClass || !toClass) {
            return NextResponse.json({ error: 'One or both classes not found in this school' }, { status: 404 })
        }

        // Get students to promote
        let studentsToPromote
        if (studentIds && studentIds.length > 0) {
            studentsToPromote = await prisma.student.findMany({
                where: {
                    id: { in: studentIds },
                    classId: fromClassId,
                    schoolId,
                    status: 'ACTIVE'
                },
                select: { id: true, firstName: true, lastName: true, admissionNumber: true }
            })
        } else {
            studentsToPromote = await prisma.student.findMany({
                where: {
                    classId: fromClassId,
                    schoolId,
                    status: 'ACTIVE'
                },
                select: { id: true, firstName: true, lastName: true, admissionNumber: true }
            })
        }

        if (studentsToPromote.length === 0) {
            return NextResponse.json({ error: 'No active students found to promote' }, { status: 400 })
        }

        // Get fee structures for the target class (for preview info in payload)
        const activePeriod = await prisma.academicPeriod.findFirst({
            where: { schoolId, isActive: true }
        })

        let targetFees: any[] = []
        if (activePeriod) {
            targetFees = await prisma.feeStructure.findMany({
                where: {
                    schoolId,
                    academicPeriodId: activePeriod.id,
                    isActive: true,
                    OR: [
                        { classId: toClassId },
                        { classId: null }
                    ]
                }
            })
        }

        const totalNewFees = targetFees.reduce((sum, fs) => sum + fs.amount, 0)

        // Build the approval payload
        const payload = {
            fromClassId,
            fromClassName: `${fromClass.name}${fromClass.stream ? ' ' + fromClass.stream : ''}`,
            toClassId,
            toClassName: `${toClass.name}${toClass.stream ? ' ' + toClass.stream : ''}`,
            studentIds: studentsToPromote.map(s => s.id),
            studentCount: studentsToPromote.length,
            students: studentsToPromote.map(s => ({
                id: s.id,
                name: `${s.firstName} ${s.lastName}`,
                admissionNumber: s.admissionNumber
            })),
            academicYear: academicYear || activePeriod?.academicYear || new Date().getFullYear().toString(),
            term: term || activePeriod?.term || 'Term 3',
            notes,
            targetFeeTotal: totalNewFees,
            activePeriodId: activePeriod?.id || null
        }

        // Create the approval request
        const approvalRequest = await prisma.approvalRequest.create({
            data: {
                type: 'GRADE_PROMOTION',
                payload: JSON.stringify(payload),
                reason: `Promote ${studentsToPromote.length} student(s) from ${payload.fromClassName} to ${payload.toClassName}`,
                requestedById: session.user.id,
                schoolId,
                status: 'PENDING'
            }
        })

        // Audit log
        await prisma.auditLog.create({
            data: {
                action: 'GRADE_PROMOTION_REQUESTED',
                entityType: 'ApprovalRequest',
                entityId: approvalRequest.id,
                userId: session.user.id,
                schoolId,
                details: JSON.stringify({
                    fromClass: payload.fromClassName,
                    toClass: payload.toClassName,
                    studentCount: studentsToPromote.length
                })
            }
        })

        return NextResponse.json({
            success: true,
            message: `Grade promotion request created for ${studentsToPromote.length} student(s). Awaiting principal approval.`,
            approvalRequestId: approvalRequest.id,
            studentCount: studentsToPromote.length
        })

    } catch (error: any) {
        console.error('Grade Promotion Error:', error)
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}
