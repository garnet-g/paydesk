import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { CommunicationEngine } from '@/lib/communication'

// GET /api/attendance
// Fetches attendance records for a class on a specific date
export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const classId = searchParams.get('classId')
        const dateStr = searchParams.get('date')
        const academicPeriodId = searchParams.get('academicPeriodId')

        if (!classId || !dateStr || !academicPeriodId) {
            return new NextResponse('Missing required parameters', { status: 400 })
        }

        const date = new Date(dateStr)
        date.setHours(0, 0, 0, 0)

        const nextDay = new Date(date)
        nextDay.setDate(date.getDate() + 1)

        // Find existing attendance records for the class on this date
        const attendanceRecords = await prisma.attendance.findMany({
            where: {
                student: { classId: classId || '' },
                date: {
                    gte: date,
                    lt: nextDay
                },
                academicPeriodId
            },
            include: {
                student: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        middleName: true,
                        admissionNumber: true,
                    }
                }
            }
        })

        if (attendanceRecords.length > 0) {
            return NextResponse.json(attendanceRecords)
        }

        // Return roster if empty
        const whereClause: any = {
            schoolId: session.user.schoolId,
            status: 'ACTIVE'
        }
        if (classId) whereClause.classId = classId

        const students = await prisma.student.findMany({
            where: whereClause,
            select: {
                id: true,
                firstName: true,
                lastName: true,
                middleName: true,
                admissionNumber: true,
            },
            orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }]
        })

        const emptyRecords = students.map(student => ({
            id: `new-${student.id}`,
            studentId: student.id,
            student,
            date: date.toISOString(),
            status: '',
            reason: null,
            academicPeriodId,
            schoolId: session.user.schoolId
        }))

        return NextResponse.json(emptyRecords)

    } catch (error) {
        console.error('[ATTENDANCE_GET]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}

// POST /api/attendance
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.schoolId) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const body = await request.json()
        const { records, sendSMS } = body

        if (!Array.isArray(records) || records.length === 0) {
            return new NextResponse('Invalid records payload', { status: 400 })
        }

        const schoolId = session.user.schoolId
        const academicPeriodId = records[0].academicPeriodId
        const recordDateStr = records[0].date
        const recordDate = new Date(recordDateStr)
        recordDate.setHours(0, 0, 0, 0)

        const results = await prisma.$transaction(async (tx) => {
            const upserted = []
            for (const record of records) {
                if (!record.status) continue; // Skip un-marked records

                const isNew = record.id.startsWith('new-')
                let dbRecord;

                if (isNew) {
                    dbRecord = await tx.attendance.create({
                        data: {
                            date: recordDate,
                            status: record.status,
                            reason: record.reason || null,
                            studentId: record.studentId,
                            schoolId: schoolId as string,
                            academicPeriodId
                        }
                    })
                } else {
                    dbRecord = await tx.attendance.update({
                        where: { id: record.id },
                        data: {
                            status: record.status,
                            reason: record.reason || null
                        }
                    })
                }
                upserted.push(dbRecord)
            }
            return upserted
        })

        if (sendSMS) {
            const absentRecords = records.filter(r => r.status === 'ABSENT')

            if (absentRecords.length > 0) {
                const absentStudents = await prisma.student.findMany({
                    where: { id: { in: absentRecords.map(r => r.studentId) } },
                    include: {
                        guardians: {
                            where: { isPrimary: true },
                            include: { user: true }
                        }
                    }
                })

                Promise.all(absentStudents.map(async (student) => {
                    const primaryGuardian = student.guardians[0]
                    if (primaryGuardian?.user?.phoneNumber) {
                        const message = `Dear parent, ${student.firstName} ${student.lastName} was marked ABSENT on ${recordDate.toLocaleDateString('en-GB')}. Please contact the school if this is an error.`
                        await CommunicationEngine.sendSMS({
                            to: primaryGuardian.user.phoneNumber,
                            message,
                            studentId: student.id,
                            schoolId: schoolId as string
                        }).catch(e => console.error("Failed to send absent SMS:", e))
                    }
                })).catch(e => console.error("Batch SMS failure:", e))
            }
        }

        return NextResponse.json(results)

    } catch (error) {
        console.error('[ATTENDANCE_POST]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
