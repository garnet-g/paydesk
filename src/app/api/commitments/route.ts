import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session) return new NextResponse('Unauthorized', { status: 401 })

    const { searchParams } = new URL(req.url)
    const studentId = searchParams.get('studentId')

    const where: any = {}
    if (session.user.role === 'PARENT') {
        where.userId = session.user.id
    } else {
        where.schoolId = session.user.schoolId as string
    }

    if (studentId) where.studentId = studentId

    try {
        const commitments = await prisma.paymentCommitment.findMany({
            where,
            include: {
                student: { select: { firstName: true, lastName: true } },
                invoice: { select: { invoiceNumber: true, balance: true } }
            },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json(commitments || [])
    } catch (error) {
        console.error('Commitment Fetch Error:', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'PARENT') {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    const { studentId, invoiceId, amount, frequency, startDate } = await req.json()

    try {
        const commitment = await prisma.paymentCommitment.create({
            data: {
                amount,
                frequency,
                startDate: new Date(startDate),
                studentId,
                invoiceId,
                userId: session.user.id,
                schoolId: session.user.schoolId as string,
                status: 'ACTIVE'
            }
        })

        return NextResponse.json(commitment)
    } catch (error) {
        console.error('Commitment Create Error:', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
