import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'PRINCIPAL' && session.user.role !== 'SUPER_ADMIN')) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    try {
        const { id } = await params
        const { response, status } = await req.json()

        const inquiry = await prisma.inquiry.update({
            where: { id },
            data: {
                response: response || undefined,
                status: status || undefined,
                resolvedAt: status === 'RESOLVED' ? new Date() : undefined,
            },
        })

        return NextResponse.json(inquiry)
    } catch (error: any) {
        console.error('Failed to update inquiry:', error)
        return new NextResponse(error.message || 'Internal Server Error', { status: 500 })
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'PRINCIPAL' && session.user.role !== 'SUPER_ADMIN')) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    try {
        const { id } = await params
        await prisma.inquiry.delete({ where: { id } })
        return new NextResponse(null, { status: 204 })
    } catch (error: any) {
        console.error('Failed to delete inquiry:', error)
        return new NextResponse(error.message || 'Internal Server Error', { status: 500 })
    }
}
