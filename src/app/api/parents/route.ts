import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
    const session = await getServerSession(authOptions)
    const { searchParams } = new URL(req.url)
    const query = searchParams.get('search')

    if (!session || (session.user.role !== 'PRINCIPAL' && session.user.role !== 'SUPER_ADMIN')) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    let where: any = {
        role: 'PARENT',
        schoolId: session.user.schoolId!
    }

    if (query) {
        where.OR = [
            { firstName: { contains: query, mode: 'insensitive' } },
            { lastName: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
        ]
    }

    const parents = await prisma.user.findMany({
        where,
        include: {
            guardianships: {
                include: {
                    student: true
                }
            }
        },
        orderBy: { createdAt: 'desc' },
        take: query ? 5 : undefined // Limit results for search
    })

    return NextResponse.json(parents)
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'PRINCIPAL' && session.user.role !== 'SUPER_ADMIN')) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    try {
        const data = await req.json()
        const { firstName, lastName, email, phoneNumber } = data

        if (!firstName || !lastName || !email) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        })

        if (existingUser) {
            return NextResponse.json({ error: 'A user with this email already exists' }, { status: 400 })
        }

        const { hash } = await import('bcryptjs')

        // Fetch school name for default password
        const school = await prisma.school.findUnique({
            where: { id: session.user.schoolId! }
        })
        const schoolName = school?.name || 'School'
        const defaultPassword = `${schoolName}@123`
        const hashedPassword = await hash(defaultPassword, 10)

        const parent = await (prisma.user as any).create({
            data: {
                firstName,
                lastName,
                email,
                phoneNumber,
                password: hashedPassword,
                role: 'PARENT',
                schoolId: session.user.schoolId, // Auto-assign to current school
                requiresPasswordChange: true,
            }
        })

        // Create audit log
        await prisma.auditLog.create({
            data: {
                action: 'PARENT_CREATED',
                entityType: 'User',
                entityId: parent.id,
                userId: session.user.id,
                schoolId: session.user.schoolId,
                details: JSON.stringify(parent),
            },
        })

        return NextResponse.json(parent)
    } catch (error: any) {
        console.error('Failed to create parent:', error)
        return new NextResponse(error.message || 'Internal Server Error', { status: 500 })
    }
}
