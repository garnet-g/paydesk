import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hash } from 'bcryptjs'
import { isOfficialEmail } from '@/lib/utils'

export async function GET(req: Request) {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'PRINCIPAL' || !session.user.schoolId) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    try {
        const staffMembers = await prisma.user.findMany({
            where: {
                schoolId: session.user.schoolId,
                role: { in: ['PRINCIPAL', 'FINANCE_MANAGER'] }
            },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phoneNumber: true,
                role: true,
                isActive: true,
                createdAt: true,
                lastLogin: true
            }
        })

        return NextResponse.json(staffMembers)
    } catch (error: any) {
        console.error('Failed to fetch staff:', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'PRINCIPAL' || !session.user.schoolId) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    try {
        const data = await req.json()
        const { firstName, lastName, email, phoneNumber, role } = data

        if (email && !isOfficialEmail(email)) {
            return new NextResponse('Staff email must be an official domain email', { status: 400 })
        }

        if (!['FINANCE_MANAGER'].includes(role)) {
            return new NextResponse('Invalid Role', { status: 400 })
        }

        const existingUser = await prisma.user.findUnique({ where: { email } })
        if (existingUser) {
            return new NextResponse('User with this email already exists', { status: 400 })
        }

        const defaultPassword = 'password123'
        const hashedPassword = await hash(defaultPassword, 10)

        const newStaff = await prisma.user.create({
            data: {
                firstName,
                lastName,
                email,
                phoneNumber,
                role,
                schoolId: session.user.schoolId,
                password: hashedPassword,
                requiresPasswordChange: true
            }
        })

        await prisma.auditLog.create({
            data: {
                action: 'STAFF_CREATED',
                entityType: 'User',
                entityId: newStaff.id,
                userId: session.user.id,
                schoolId: session.user.schoolId,
                details: JSON.stringify({ email: newStaff.email, role: newStaff.role })
            }
        })

        return NextResponse.json(newStaff)
    } catch (error: any) {
        console.error('Failed to create staff:', error)
        return new NextResponse(error.message || 'Internal Error', { status: 500 })
    }
}
