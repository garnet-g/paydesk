import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const academicPeriodId = searchParams.get('academicPeriodId')

        const where: any = { schoolId: session.user.schoolId }
        if (academicPeriodId) {
            where.academicPeriodId = academicPeriodId
        }

        const exams = await prisma.exam.findMany({
            where,
            include: {
                academicPeriod: { select: { term: true, academicYear: true } }
            },
            orderBy: { date: 'desc' }
        })

        return NextResponse.json(exams)
    } catch (error) {
        console.error('[EXAMS_GET]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user || (session.user.role !== 'PRINCIPAL' && session.user.role !== 'FINANCE_MANAGER')) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const body = await request.json()
        const { name, date, academicPeriodId } = body

        if (!name || !date || !academicPeriodId) {
            return new NextResponse('Missing required fields', { status: 400 })
        }

        const exam = await prisma.exam.create({
            data: {
                name,
                date: new Date(date),
                academicPeriodId,
                schoolId: session.user.schoolId as string
            }
        })

        return NextResponse.json(exam)
    } catch (error) {
        console.error('[EXAMS_POST]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
