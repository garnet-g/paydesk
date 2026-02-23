import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
    const session = await getServerSession(authOptions)

    if (!session || !session.user.schoolId) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    try {
        const school = await prisma.school.findUnique({
            where: { id: session.user.schoolId },
            include: {
                _count: {
                    select: { students: true }
                }
            }
        })

        if (!school) {
            return new NextResponse('School not found', { status: 404 })
        }

        return NextResponse.json(school)
    } catch (error) {
        console.error('Failed to fetch school details:', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
