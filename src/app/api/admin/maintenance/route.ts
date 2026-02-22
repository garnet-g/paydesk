import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const flag = await prisma.systemSetting.findUnique({
            where: { key: 'MAINTENANCE_MODE' }
        })
        return NextResponse.json({ active: flag?.value === 'true' })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { active } = await req.json()

        await prisma.systemSetting.upsert({
            where: { key: 'MAINTENANCE_MODE' },
            create: { key: 'MAINTENANCE_MODE', value: active ? 'true' : 'false' },
            update: { value: active ? 'true' : 'false' }
        })

        // Audit Log
        await prisma.auditLog.create({
            data: {
                action: active ? 'MAINTENANCE_MODE_ENABLED' : 'MAINTENANCE_MODE_DISABLED',
                entityType: 'System',
                userId: session.user.id
            }
        })

        return NextResponse.json({ success: true, active })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
