import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params
        const session = await getServerSession(authOptions)
        if (!session?.user?.schoolId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const data = await request.json()
        const { studentId, action } = data // action: 'add' | 'remove'

        if (action === 'add') {
            await prisma.student.update({
                where: { id: studentId, schoolId: session.user.schoolId },
                data: { transportRouteId: id }
            })
        } else if (action === 'remove') {
            await prisma.student.update({
                where: { id: studentId, schoolId: session.user.schoolId },
                data: { transportRouteId: null }
            })
        }

        return NextResponse.json({ success: true })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
