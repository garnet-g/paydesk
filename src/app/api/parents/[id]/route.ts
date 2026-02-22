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
        const { firstName, lastName, email, phoneNumber, isActive } = await req.json()

        const parent = await prisma.user.update({
            where: { id },
            data: {
                firstName: firstName || undefined,
                lastName: lastName || undefined,
                email: email || undefined,
                phoneNumber: phoneNumber || undefined,
                isActive: isActive !== undefined ? isActive : undefined,
            },
        })

        // Create audit log
        await prisma.auditLog.create({
            data: {
                action: 'PARENT_UPDATED',
                entityType: 'User',
                entityId: parent.id,
                userId: session.user.id,
                schoolId: session.user.schoolId,
                details: JSON.stringify(parent),
            },
        })

        return NextResponse.json(parent)
    } catch (error: any) {
        console.error('Failed to update parent:', error)
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

        // Check if parent has active guardianships
        // (Prisma schema has onDelete: Cascade, so it will delete StudentGuardian entries)

        await prisma.user.delete({
            where: { id, role: 'PARENT' }
        })

        // Create audit log
        await prisma.auditLog.create({
            data: {
                action: 'PARENT_DELETED',
                entityType: 'User',
                entityId: id,
                userId: session.user.id,
                schoolId: session.user.schoolId,
            },
        })

        return new NextResponse(null, { status: 204 })
    } catch (error: any) {
        console.error('Failed to delete parent:', error)
        return new NextResponse(error.message || 'Internal Server Error', { status: 500 })
    }
}
