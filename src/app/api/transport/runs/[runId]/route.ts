import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function PATCH(request: Request, props: { params: Promise<{ runId: string }> }) {
    try {
        const params = await props.params;
        const session = await getServerSession(authOptions)
        if (!session?.user?.schoolId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const data = await request.json()
        const { status } = data // 'COMPLETED' or 'IN_PROGRESS'

        const updated = await prisma.transportRun.update({
            where: { id: params.runId, schoolId: session.user.schoolId },
            data: {
                status,
                ...(status === 'COMPLETED' ? { completedAt: new Date() } : {})
            }
        })

        return NextResponse.json(updated)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
