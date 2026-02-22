import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'PRINCIPAL') {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    const { results } = await req.json() // Array of { studentId, subject, score, maxScore, remarks }
    const examId = params.id

    try {
        const createdResults = await prisma.$transaction(
            results.map((res: any) =>
                prisma.examResult.create({
                    data: {
                        ...res,
                        examId
                    }
                })
            )
        )

        return NextResponse.json(createdResults)
    } catch (error) {
        console.error('Results Create Error:', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const session = await getServerSession(authOptions)
    if (!session) return new NextResponse('Unauthorized', { status: 401 })

    const { searchParams } = new URL(req.url)
    const studentId = searchParams.get('studentId')
    const examId = params.id

    try {
        if (studentId) {
            // Fetch everything needed for a Result Slip
            const [exam, student, results, school] = await Promise.all([
                prisma.exam.findUnique({
                    where: { id: examId },
                    include: { academicPeriod: true }
                }),
                prisma.student.findUnique({ where: { id: studentId } }),
                prisma.examResult.findMany({ where: { examId, studentId } }),
                prisma.school.findUnique({ where: { id: session.user.schoolId as string } })
            ])

            if (!exam || !student || !school) {
                return new NextResponse('Not Found', { status: 404 })
            }

            return NextResponse.json({ exam, student, results, school })
        }

        // Otherwise return all results for the exam
        const results = await prisma.examResult.findMany({
            where: { examId },
            include: { student: true }
        })
        return NextResponse.json(results)

    } catch (error) {
        console.error('Results Fetch Error:', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
