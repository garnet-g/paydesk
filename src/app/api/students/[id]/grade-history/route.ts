import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET: Fetch grade history for a student
export async function GET(
    req: Request,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions)
    if (!session) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    try {
        const history = await prisma.gradeHistory.findMany({
            where: { studentId: params.id },
            include: {
                fromClass: { select: { id: true, name: true, stream: true } },
                toClass: { select: { id: true, name: true, stream: true } }
            },
            orderBy: { promotionDate: 'desc' }
        })

        return NextResponse.json(history)
    } catch (error) {
        console.error('Grade History Fetch Error:', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
