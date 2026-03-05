import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.schoolId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const teachers = await prisma.teacher.findMany({
            where: { schoolId: session.user.schoolId },
            include: {
                user: {
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true,
                        phoneNumber: true,
                        isActive: true
                    }
                },
                homeroomClass: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        return NextResponse.json(teachers)
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
