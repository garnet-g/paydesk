
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions)
    const { id } = await params

    if (!session || !session.user.schoolId) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    const cls = await prisma.class.findFirst({
        where: {
            id,
            schoolId: session.user.schoolId
        },
        include: {
            _count: {
                select: { students: true }
            }
        }
    })

    if (!cls) {
        return new NextResponse('Class not found', { status: 404 })
    }

    return NextResponse.json(cls)
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions)
    const { id } = await params

    if (!session || !session.user.schoolId) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    try {
        const body = await req.json()
        const { name, stream } = body

        // Verify ownership
        const existingClass = await prisma.class.findFirst({
            where: { id, schoolId: session.user.schoolId }
        })

        if (!existingClass) {
            return new NextResponse('Class not found', { status: 404 })
        }

        // Check for duplicates if name/stream changed
        if (name !== undefined || stream !== undefined) {
            const duplicate = await prisma.class.findFirst({
                where: {
                    schoolId: session.user.schoolId,
                    name: name || existingClass.name,
                    stream: stream !== undefined ? (stream || null) : existingClass.stream,
                    NOT: { id: id }
                }
            })

            if (duplicate) {
                return new NextResponse('Another class with this name and stream already exists', { status: 409 })
            }
        }

        const updatedClass = await prisma.class.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(stream !== undefined && { stream: stream || null })
            }
        })

        return NextResponse.json(updatedClass)
    } catch (error: any) {
        console.error('Failed to update class:', error)
        return new NextResponse(error.message || 'Internal Server Error', { status: 500 })
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions)
    const { id } = await params

    if (!session || !session.user.schoolId) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    try {
        // Verify ownership
        const existingClass = await prisma.class.findFirst({
            where: { id, schoolId: session.user.schoolId },
            include: { _count: { select: { students: true } } }
        })

        if (!existingClass) {
            return new NextResponse('Class not found', { status: 404 })
        }

        if (existingClass._count.students > 0) {
            return new NextResponse('Cannot delete class with enrolled students', { status: 400 })
        }

        await prisma.class.delete({
            where: { id }
        })

        return new NextResponse(null, { status: 204 })
    } catch (error: any) {
        console.error('Failed to delete class:', error)
        return new NextResponse(error.message || 'Internal Server Error', { status: 500 })
    }
}
