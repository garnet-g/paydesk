import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session) return new NextResponse('Unauthorized', { status: 401 })

    const { searchParams } = new URL(req.url)
    const studentId = searchParams.get('studentId')
    const schoolId = session.user.schoolId as string

    try {
        const where: any = { schoolId }
        if (studentId) where.studentId = studentId

        const attendance = await prisma.attendance.findMany({
            where,
            orderBy: { date: 'desc' },
            include: {
                student: { select: { firstName: true, lastName: true } }
            }
        })

        return NextResponse.json(attendance)
    } catch (error) {
        console.error('Attendance Fetch Error:', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'PRINCIPAL' && session.user.role !== 'FINANCE_MANAGER')) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    const { studentId, date, status, reason } = await req.json()
    const { schoolId } = session.user

    try {
        // Find active academic period
        const period = await prisma.academicPeriod.findFirst({
            where: { schoolId: schoolId as string, isActive: true }
        })

        if (!period) return new NextResponse('No active term found', { status: 400 })

        const attendance = await prisma.attendance.create({
            data: {
                date: new Date(date),
                status,
                reason,
                studentId,
                schoolId: schoolId as string,
                academicPeriodId: period.id
            }
        })

        return NextResponse.json(attendance)
    } catch (error) {
        console.error('Attendance Create Error:', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
