import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
    const session = await getServerSession(authOptions)

    if (!session) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    const where: any = {}

    if (session.user.role === 'PRINCIPAL') {
        where.schoolId = session.user.schoolId
    } else if (session.user.role === 'PARENT') {
        where.userId = session.user.id
    } else if (session.user.role === 'SUPER_ADMIN') {
        // Super Admin sees all
    }

    const inquiries = await prisma.inquiry.findMany({
        where,
        include: {
            user: {
                select: {
                    firstName: true,
                    lastName: true,
                    email: true
                }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    })

    return NextResponse.json(inquiries)
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)

    if (!session) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    try {
        const { subject, message } = await req.json()

        const inquiry = await prisma.inquiry.create({
            data: {
                subject,
                message,
                userId: session.user.id,
                schoolId: session.user.schoolId!, // Use parent's schoolId
            }
        })

        return NextResponse.json(inquiry)
    } catch (error) {
        console.error('Failed to create inquiry:', error)
        return new NextResponse('Internal Server Error', { status: 500 })
    }
}
