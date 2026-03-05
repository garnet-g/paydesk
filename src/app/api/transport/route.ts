import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.schoolId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const routes = await prisma.transportRoute.findMany({
            where: { schoolId: session.user.schoolId },
            include: {
                students: {
                    select: { id: true, firstName: true, lastName: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json(routes)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.schoolId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'PRINCIPAL' && session.user.role !== 'FINANCE_MANAGER') {
            return NextResponse.json({ error: 'Unauthorized role' }, { status: 403 })
        }

        const data = await request.json()
        const { name, driver, vehicleNumber, monthlyFee, capacity, stops } = data

        const newRoute = await prisma.transportRoute.create({
            data: {
                name,
                driver,
                vehicleNumber,
                monthlyFee: parseFloat(monthlyFee) || 0,
                capacity: parseInt(capacity) || 40,
                stops: JSON.stringify(stops || []),
                schoolId: session.user.schoolId
            }
        })

        return NextResponse.json(newRoute)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
