import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(req: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'PRINCIPAL' || !session.user.schoolId) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    try {
        const staff = await prisma.user.findUnique({
            where: { id: params.id }
        })

        if (!staff || staff.schoolId !== session.user.schoolId) {
            return new NextResponse('Staff not found', { status: 404 })
        }

        const data = await req.json()
        const { firstName, lastName, email, phoneNumber, role, salary, designation, subjects, staffId } = data

        const allowedRoles = ['FINANCE_MANAGER', 'TEACHER', 'REGISTRAR', 'BURSAR', 'DEPUTY_PRINCIPAL', 'PRINCIPAL', 'LIBRARIAN', 'DRIVER', 'BUS_CONDUCTOR', 'SECURITY', 'CLEANER', 'SUPPORT_STAFF']
        if (role && !allowedRoles.includes(role)) {
            return new NextResponse('Invalid Role', { status: 400 })
        }

        const updatedStaff = await prisma.user.update({
            where: { id: params.id },
            data: {
                firstName: firstName || undefined,
                lastName: lastName || undefined,
                email: email || undefined,
                phoneNumber: phoneNumber || undefined,
                role: role || undefined,
                salary: salary !== undefined ? salary : undefined,
                designation: designation !== undefined ? designation : undefined,
                subjects: subjects !== undefined ? subjects : undefined,
                staffId: staffId !== undefined ? staffId : undefined,
            }
        })

        await prisma.auditLog.create({
            data: {
                action: 'STAFF_UPDATED',
                entityType: 'User',
                entityId: params.id,
                userId: session.user.id,
                schoolId: session.user.schoolId,
                details: JSON.stringify({ email: updatedStaff.email, role: updatedStaff.role })
            }
        })

        return NextResponse.json(updatedStaff)
    } catch (error: any) {
        console.error('Failed to update staff:', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'PRINCIPAL' || !session.user.schoolId) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    try {
        const staff = await prisma.user.findUnique({
            where: { id: params.id }
        })

        if (!staff || staff.schoolId !== session.user.schoolId) {
            return new NextResponse('Staff not found', { status: 404 })
        }

        if (staff.role === 'PRINCIPAL') {
            return new NextResponse('Cannot delete the principal', { status: 400 })
        }

        await prisma.user.delete({
            where: { id: params.id }
        })

        await prisma.auditLog.create({
            data: {
                action: 'STAFF_DELETED',
                entityType: 'User',
                entityId: params.id,
                userId: session.user.id,
                schoolId: session.user.schoolId,
                details: JSON.stringify({ email: staff.email, role: staff.role })
            }
        })

        return new NextResponse(null, { status: 204 })
    } catch (error: any) {
        console.error('Failed to delete staff:', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
