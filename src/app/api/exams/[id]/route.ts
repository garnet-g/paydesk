import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const exam = await prisma.exam.findUnique({
            where: {
                id,
                schoolId: session.user.schoolId as string
            },
            include: {
                academicPeriod: { select: { term: true, academicYear: true } }
            }
        })

        if (!exam) return new NextResponse('Not Found', { status: 404 })

        return NextResponse.json(exam)
    } catch (error) {
        console.error('[EXAM_GET_SINGLE]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const session = await getServerSession(authOptions)
        if (!session?.user || (session.user.role !== 'PRINCIPAL' && session.user.role !== 'FINANCE_MANAGER')) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const body = await request.json()
        const { name, date } = body

        const updateData: any = {}
        if (name) updateData.name = name
        if (date) updateData.date = new Date(date)

        const exam = await prisma.exam.update({
            where: {
                id,
                schoolId: session.user.schoolId as string
            },
            data: updateData
        })

        return NextResponse.json(exam)
    } catch (error) {
        console.error('[EXAM_PATCH]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const session = await getServerSession(authOptions)
        if (!session?.user || session.user.role !== 'PRINCIPAL') {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        await prisma.exam.delete({
            where: {
                id,
                schoolId: session.user.schoolId as string
            }
        })

        return new NextResponse(null, { status: 204 })
    } catch (error) {
        console.error('[EXAM_DELETE]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
