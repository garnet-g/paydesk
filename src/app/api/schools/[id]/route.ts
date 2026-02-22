import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isOfficialEmail } from '@/lib/utils'

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'SUPER_ADMIN') {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    try {
        const { id } = await params
        const school = await prisma.school.findUnique({
            where: { id },
            include: {
                users: {
                    where: { role: 'PRINCIPAL' },
                    take: 1
                }
            }
        })

        if (!school) return new NextResponse('Not Found', { status: 404 })

        return NextResponse.json(school)
    } catch (error) {
        return new NextResponse('Error', { status: 500 })
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'SUPER_ADMIN') {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    try {
        const { id } = await params
        const data = await req.json()
        const { name, code, address, phoneNumber, email, isActive, planTier, subscriptionFee } = data

        if (email && !isOfficialEmail(email)) {
            return new NextResponse('School email must be an official domain email', { status: 400 })
        }

        const school = await prisma.school.update({
            where: { id },
            data: {
                name,
                code,
                address,
                phoneNumber,
                email,
                isActive,
                planTier,
                subscriptionFee
            },
        })

        // Create audit log
        await prisma.auditLog.create({
            data: {
                action: 'SCHOOL_UPDATED',
                entityType: 'School',
                entityId: school.id,
                userId: session.user.id,
                details: JSON.stringify(school),
            },
        })

        return NextResponse.json(school)
    } catch (error: any) {
        console.error('Failed to update school:', error)
        return new NextResponse(error.message || 'Internal Server Error', { status: 500 })
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'SUPER_ADMIN') {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    try {
        const { id } = await params

        await prisma.school.delete({
            where: { id },
        })

        // Create audit log
        await prisma.auditLog.create({
            data: {
                action: 'SCHOOL_DELETED',
                entityType: 'School',
                entityId: id,
                userId: session.user.id,
            },
        })

        return new NextResponse(null, { status: 204 })
    } catch (error: any) {
        console.error('Failed to delete school:', error)
        return new NextResponse(error.message || 'Internal Server Error', { status: 500 })
    }
}
