import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hash } from 'bcryptjs'

// GET - List all SUPER_ADMIN users
export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (session?.user?.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const admins = await prisma.user.findMany({
        where: { role: 'SUPER_ADMIN' },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
            isActive: true,
            requiresPasswordChange: true,
            createdAt: true,
            lastLogin: true,
        },
        orderBy: { createdAt: 'asc' }
    })

    return NextResponse.json(admins)
}

// POST - Create a new SUPER_ADMIN
export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (session?.user?.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { firstName, lastName, email, phoneNumber, password } = await req.json()

    if (!firstName || !lastName || !email || !password) {
        return NextResponse.json({ error: 'First name, last name, email and password are required.' }, { status: 400 })
    }

    // Check if email already exists
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
        return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 })
    }

    const hashedPassword = await hash(password, 12)

    const admin = await prisma.user.create({
        data: {
            firstName,
            lastName,
            email,
            phoneNumber: phoneNumber || null,
            password: hashedPassword,
            role: 'SUPER_ADMIN',
            isActive: true,
            requiresPasswordChange: true, // Force password change on first login
            termsAccepted: false,
        } as any,
        select: { id: true, email: true, firstName: true, lastName: true }
    })

    // Audit log
    await prisma.auditLog.create({
        data: {
            action: 'CREATE_PLATFORM_ADMIN',
            entityType: 'User',
            entityId: admin.id,
            userId: session.user.id,
            details: `Created platform admin: ${email}`
        }
    })

    return NextResponse.json({ success: true, admin })
}
