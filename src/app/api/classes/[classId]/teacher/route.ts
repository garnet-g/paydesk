import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function PATCH(request: Request, { params }: { params: { classId: string } }) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.schoolId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // Only Principals and Admins can assign teachers
        if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'PRINCIPAL') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const data = await request.json()
        const { teacherId } = data // Can be null to unassign

        const updatedClass = await prisma.class.update({
            where: { id: params.classId, schoolId: session.user.schoolId },
            data: { homeroomTeacherId: teacherId || null },
            include: { homeroomTeacher: { include: { user: true } } }
        })

        return NextResponse.json(updatedClass)

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
