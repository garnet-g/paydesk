import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function PATCH(request: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const params = await props.params;
        const session = await getServerSession(authOptions)
        if (!session?.user?.schoolId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const data = await request.json()
        const { name, driver, vehicleNumber, monthlyFee, capacity, stops } = data

        const updated = await prisma.transportRoute.update({
            where: { id: params.id, schoolId: session.user.schoolId },
            data: {
                ...(name && { name }),
                ...(driver && { driver }),
                ...(vehicleNumber && { vehicleNumber }),
                ...(monthlyFee && { monthlyFee: parseFloat(monthlyFee) }),
                ...(capacity && { capacity: parseInt(capacity) }),
                ...(stops && { stops: JSON.stringify(stops) })
            }
        })

        return NextResponse.json(updated)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
    try {
        const params = await props.params;
        const session = await getServerSession(authOptions)
        if (!session?.user?.schoolId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // Remove students from route first
        await prisma.student.updateMany({
            where: { transportRouteId: params.id, schoolId: session.user.schoolId },
            data: { transportRouteId: null }
        })

        await prisma.transportRoute.delete({
            where: { id: params.id, schoolId: session.user.schoolId }
        })

        return NextResponse.json({ success: true })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
