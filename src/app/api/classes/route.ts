import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
    const session = await getServerSession(authOptions)

    if (!session || !session.user.schoolId) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    const classes = await prisma.class.findMany({
        where: { schoolId: session.user.schoolId },
        orderBy: { name: 'asc' },
        include: {
            _count: {
                select: { students: true }
            },
            homeroomTeacher: {
                select: { id: true, firstName: true, lastName: true, designation: true }
            }
        }
    })

    return NextResponse.json(classes)
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)

    if (!session || !session.user.schoolId) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    try {
        const body = await req.json()
        const { name, stream, homeroomTeacherId } = body
        console.log('[API/Classes] Registration attempt:', { name, stream, homeroomTeacherId, schoolId: session.user.schoolId })

        if (!name) {
            return new NextResponse('Class name is required', { status: 400 })
        }

        const existingClass = await prisma.class.findFirst({
            where: {
                schoolId: session.user.schoolId!,
                name,
                stream: stream || null
            }
        })

        if (existingClass) {
            console.log('[API/Classes] Registration failed: Class already exists', { name, stream })
            return new NextResponse('Class already exists', { status: 409 })
        }

        const newClass = await prisma.class.create({
            data: {
                name,
                stream: stream || null,
                schoolId: session.user.schoolId!,
                homeroomTeacherId: homeroomTeacherId || null,
            },
            include: {
                homeroomTeacher: {
                    select: {
                        firstName: true,
                        lastName: true
                    }
                }
            }
        })

        console.log('[API/Classes] Registration successful:', newClass.id)
        return NextResponse.json(newClass)
    } catch (error: any) {
        console.error('[API/Classes] Registration error:', error)
        return new NextResponse(error.message || 'Internal Server Error', { status: 500 })
    }
}
