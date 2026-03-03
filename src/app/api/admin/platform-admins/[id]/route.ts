import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// DELETE - Permanently remove a platform admin
export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions)
    if (session?.user?.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const admin = await prisma.user.findUnique({
        where: { id: params.id },
        select: { id: true, role: true, email: true }
    })

    if (!admin || admin.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Admin not found' }, { status: 404 })
    }

    if (admin.email === session.user.email) {
        return NextResponse.json({ error: "You can't delete your own account." }, { status: 400 })
    }

    await prisma.auditLog.create({
        data: {
            action: 'DELETE_PLATFORM_ADMIN',
            entityType: 'User',
            entityId: params.id,
            userId: session.user.id,
            details: `Deleted platform admin: ${admin.email}`
        }
    })

    await prisma.user.delete({ where: { id: params.id } })

    return NextResponse.json({ success: true })
}

