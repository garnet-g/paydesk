import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

function calculateGrade(score: number, maxScore: number): string {
    const percentage = (score / maxScore) * 100
    if (percentage >= 75) return 'A'
    if (percentage >= 60) return 'B'
    if (percentage >= 50) return 'C'
    if (percentage >= 40) return 'D'
    return 'E'
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const classId = searchParams.get('classId')

        const resultWhere: any = { examId: id }
        if (classId) resultWhere.student = { classId }

        // Fetch existing results for this exam
        const existingResults = await prisma.examResult.findMany({
            where: resultWhere,
            include: {
                student: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        admissionNumber: true,
                        classId: true
                    }
                }
            }
        })

        if (!classId) {
            return NextResponse.json(existingResults)
        }

        // If classId is provided, we want to return a roster that includes students who don't have results yet
        const students = await prisma.student.findMany({
            where: {
                classId: String(classId),
                schoolId: session.user.schoolId as string,
                status: 'ACTIVE'
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                admissionNumber: true,
                classId: true
            },
            orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }]
        })

        // Merge existing results with the roster
        const resultsMap = new Map(existingResults.map(r => [r.studentId, r]))

        const rosterWithResults = students.map(student => {
            const existing = resultsMap.get(student.id)
            if (existing) {
                return existing
            }
            // Return empty/template record
            return {
                id: `new-${student.id}`,
                examId: id,
                studentId: student.id,
                student,
                subject: '',
                score: null,
                maxScore: 100,
                grade: null,
                remarks: null
            }
        })

        return NextResponse.json(rosterWithResults)

    } catch (error) {
        console.error('[EXAM_RESULTS_GET]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const session = await getServerSession(authOptions)
        if (!session?.user || (session.user.role !== 'PRINCIPAL' && session.user.role !== 'FINANCE_MANAGER')) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        // Verify the exam exists
        const exam = await prisma.exam.findUnique({
            where: { id }
        })

        if (!exam) return new NextResponse('Exam not found', { status: 404 })

        const body = await request.json()
        const { results } = body

        if (!Array.isArray(results)) {
            return new NextResponse('Invalid payload', { status: 400 })
        }

        const upsertedResults = await prisma.$transaction(async (tx) => {
            const processed = []
            for (const item of results) {
                // Skip rows where score wasn't entered
                if (item.score === null || item.score === undefined || item.score === '') continue

                const scoreNum = Number(item.score)
                const maxScoreNum = Number(item.maxScore || 100)
                const grade = calculateGrade(scoreNum, maxScoreNum)
                const subject = item.subject || 'General'

                const isNew = item.id.startsWith('new-')

                if (isNew) {
                    const created = await tx.examResult.create({
                        data: {
                            examId: id,
                            studentId: item.studentId,
                            subject,
                            score: scoreNum,
                            maxScore: maxScoreNum,
                            grade,
                            remarks: item.remarks || null
                        }
                    })
                    processed.push(created)
                } else {
                    const updated = await tx.examResult.update({
                        where: { id: item.id },
                        data: {
                            subject,
                            score: scoreNum,
                            maxScore: maxScoreNum,
                            grade,
                            remarks: item.remarks || null
                        }
                    })
                    processed.push(updated)
                }
            }
            return processed
        })

        return NextResponse.json(upsertedResults)

    } catch (error) {
        console.error('[EXAM_RESULTS_POST]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
