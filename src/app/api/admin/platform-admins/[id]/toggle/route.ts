import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH /api/admin/platform-admins/[id]/toggle
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (session?.user?.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const admin = await prisma.user.findUnique({
        where: { id },
        select: { id: true, role: true, email: true, isActive: true }
    })

    if (!admin || admin.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Admin not found' }, { status: 404 })
    }

    if (admin.email === session.user.email) {
        return NextResponse.json({ error: "You can't suspend your own account." }, { status: 400 })
    }

    const updated = await prisma.user.update({
        where: { id },
        data: { isActive: !admin.isActive },
        select: { id: true, isActive: true }
    })

    await prisma.auditLog.create({
        data: {
            action: updated.isActive ? 'REACTIVATE_PLATFORM_ADMIN' : 'SUSPEND_PLATFORM_ADMIN',
            entityType: 'User',
            entityId: id,
            userId: session.user.id,
            details: `${updated.isActive ? 'Reactivated' : 'Suspended'} admin: ${admin.email}`
        }
    })

    return NextResponse.json({ success: true, isActive: updated.isActive })
}
