import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.schoolId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const runs = await prisma.transportRun.findMany({
            where: { routeId: params.id, schoolId: session.user.schoolId },
            orderBy: { startedAt: 'desc' },
            include: { passengers: { include: { student: true } } }
        })

        return NextResponse.json(runs)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.schoolId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const data = await request.json()
        const { direction } = data // 'PICKUP' or 'DROPOFF'

        // Get the route and its students to bootstrap the run
        const route = await prisma.transportRoute.findUnique({
            where: { id: params.id, schoolId: session.user.schoolId },
            include: { students: true }
        })

        if (!route) return NextResponse.json({ error: 'Route not found' }, { status: 404 })

        const newRun = await prisma.transportRun.create({
            data: {
                routeId: route.id,
                schoolId: session.user.schoolId,
                driverName: route.driver,
                vehicleNumber: route.vehicleNumber,
                direction: direction || 'PICKUP',
                status: 'IN_PROGRESS',
                passengers: {
                    create: route.students.map((student) => ({
                        studentId: student.id,
                        status: 'PENDING'
                    }))
                }
            },
            include: { passengers: { include: { student: true } } }
        })

        return NextResponse.json(newRun)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
