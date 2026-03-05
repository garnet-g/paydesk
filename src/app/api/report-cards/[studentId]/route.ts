import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { renderToStream } from '@react-pdf/renderer'
import { ReportCardPDF } from '@/components/ReportCardPDF'
import React from 'react'

export async function GET(request: Request, { params }: { params: Promise<{ studentId: string }> }) {
    try {
        const { studentId } = await params
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const examId = searchParams.get('examId')

        if (!examId) {
            return new NextResponse('Missing examId parameter', { status: 400 })
        }

        // Fetch Student
        const student = await prisma.student.findUnique({
            where: { id: studentId },
            include: {
                class: true,
                guardians: true
            }
        })

        if (!student) return new NextResponse('Student not found', { status: 404 })

        // Check if Parent
        if (session.user.role === 'PARENT') {
            const isLinked = student.guardians.some(g => g.userId === session.user.id)
            if (!isLinked) return new NextResponse('Unauthorized', { status: 401 })
        } else if (student.schoolId !== session.user.schoolId) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        // Fetch School Info
        const school = await prisma.school.findUnique({
            where: { id: student.schoolId }
        })

        if (!school) return new NextResponse('School not found', { status: 404 })

        // Fetch Exam Info
        const exam = await prisma.exam.findUnique({
            where: { id: examId },
            include: { academicPeriod: true }
        })

        if (!exam) return new NextResponse('Exam not found', { status: 404 })

        // Fetch Results
        const results = await prisma.examResult.findMany({
            where: {
                studentId: student.id,
                examId: exam.id
            }
        })

        if (!results.length) {
            return new NextResponse('No results found for this student in this exam.', { status: 404 })
        }

        let totalScore = 0
        let possibleScore = 0

        const formattedResults = results.map(r => {
            const score = r.score ? Number(r.score) : 0
            const max = r.maxScore ? Number(r.maxScore) : 100
            totalScore += score
            possibleScore += max

            return {
                subject: r.subject || 'Unknown',
                score,
                maxScore: max,
                grade: r.grade || '-'
            }
        })

        let averageGrade = 'E'
        if (possibleScore > 0) {
            const meanPercentage = (totalScore / possibleScore) * 100
            if (meanPercentage >= 75) averageGrade = 'A'
            else if (meanPercentage >= 60) averageGrade = 'B'
            else if (meanPercentage >= 50) averageGrade = 'C'
            else if (meanPercentage >= 40) averageGrade = 'D'
        }

        // Generate PDF Stream
        const pdfStream = await renderToStream(
            React.createElement(ReportCardPDF, {
                schoolName: school.name,
                schoolAddress: school.address || undefined,
                schoolPhone: school.phoneNumber || undefined,
                studentName: `${student.firstName} ${student.lastName}`,
                admissionNumber: student.admissionNumber,
                className: student.class?.name || 'Unassigned',
                academicPeriod: `${exam.academicPeriod.term} ${exam.academicPeriod.academicYear}`,
                examName: exam.name,
                results: formattedResults,
                totalScore,
                possibleScore,
                averageGrade
            }) as React.ReactElement<any>
        )

        // Return as streaming response
        return new NextResponse(pdfStream as any, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `inline; filename="ReportCard-${student.admissionNumber}-${exam.name}.pdf"`,
            }
        })

    } catch (error: any) {
        console.error('[REPORT_CARD_GET]', error)
        return new NextResponse(`Internal Error: ${error?.message || 'Unknown'}`, { status: 500 })
    }
}
