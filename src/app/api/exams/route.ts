import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session) return new NextResponse('Unauthorized', { status: 401 })

    const schoolId = session.user.schoolId as string

    try {
        const exams = await prisma.exam.findMany({
            where: { schoolId },
            include: {
                academicPeriod: true,
                results: {
                    include: {
                        student: { select: { firstName: true, lastName: true, admissionNumber: true } }
                    }
                }
            },
            orderBy: { date: 'desc' }
        })

        return NextResponse.json(exams)
    } catch (error) {
        console.error('Exams Fetch Error:', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'PRINCIPAL') {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    const { name, date } = await req.json()
    const { schoolId } = session.user

    try {
        const period = await prisma.academicPeriod.findFirst({
            where: { schoolId: schoolId as string, isActive: true }
        })

        if (!period) return new NextResponse('No active term found', { status: 400 })

        const exam = await prisma.exam.create({
            data: {
                name,
                date: new Date(date),
                schoolId: schoolId as string,
                academicPeriodId: period.id
            }
        })

        return NextResponse.json(exam)
    } catch (error) {
        console.error('Exam Create Error:', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
