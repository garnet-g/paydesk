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
        const { name, stream } = body

        if (!name) {
            return new NextResponse('Class name is required', { status: 400 })
        }

        // Check if class already exists
        const existingClass = await prisma.class.findFirst({
            where: {
                schoolId: session.user.schoolId,
                name: name,
                stream: stream || null
            }
        })

        if (existingClass) {
            return new NextResponse('Class already exists', { status: 409 })
        }

        const newClass = await prisma.class.create({
            data: {
                name,
                stream: stream || null,
                schoolId: session.user.schoolId,
                capacity: 40 // Default capacity
            }
        })

        return NextResponse.json(newClass)
    } catch (error) {
        console.error('Failed to create class:', error)
        return new NextResponse('Internal Server Error', { status: 500 })
    }
}
