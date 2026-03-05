import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/attendance/[id]
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const attendance = await prisma.attendance.findUnique({
            where: {
                id,
                schoolId: session.user.schoolId as string
            },
            include: {
                student: true
            }
        })

        if (!attendance) {
            return new NextResponse('Not Found', { status: 404 })
        }

        return NextResponse.json(attendance)
    } catch (error) {
        console.error('[ATTENDANCE_GET_SINGLE]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}

// PATCH /api/attendance/[id]
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const session = await getServerSession(authOptions)
        if (!session?.user || (session.user.role !== 'PRINCIPAL' && session.user.role !== 'FINANCE_MANAGER')) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const body = await request.json()
        const { status, reason } = body

        const attendance = await prisma.attendance.update({
            where: {
                id,
                schoolId: session.user.schoolId as string
            },
            data: {
                status,
                reason
            }
        })

        return NextResponse.json(attendance)
    } catch (error) {
        console.error('[ATTENDANCE_PATCH]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}

// DELETE /api/attendance/[id]
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const session = await getServerSession(authOptions)
        if (!session?.user || session.user.role !== 'PRINCIPAL') {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        await prisma.attendance.delete({
            where: {
                id,
                schoolId: session.user.schoolId as string
            }
        })

        return new NextResponse(null, { status: 204 })
    } catch (error) {
        console.error('[ATTENDANCE_DELETE]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
