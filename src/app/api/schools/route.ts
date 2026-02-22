import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isOfficialEmail } from '@/lib/utils'

export async function GET() {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'SUPER_ADMIN') {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    const schools = await prisma.school.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            _count: {
                select: { students: true }
            },
            users: {
                where: { role: 'PRINCIPAL' },
                take: 1
            }
        }
    })

    return NextResponse.json(schools)
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'SUPER_ADMIN') {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    try {
        const data = await req.json()
        const { name, code, address, phoneNumber, email, principalName, principalEmail, principalPhone, curriculumType, curriculumConfig, planTier, subscriptionFee } = data

        if (email && !isOfficialEmail(email)) {
            return new NextResponse('School email must be an official domain email', { status: 400 })
        }

        if (principalEmail && !isOfficialEmail(principalEmail)) {
            return new NextResponse('Principal email must be an official domain email', { status: 400 })
        }

        const school = await prisma.school.create({
            data: {
                name,
                code,
                address,
                phoneNumber,
                email,
                curriculumType: curriculumType || 'CBC',
                curriculumConfig: curriculumConfig ? JSON.stringify(curriculumConfig) : null,
                planTier: planTier || 'FREE',
                subscriptionFee: subscriptionFee || 0,
            },
        })

        // Create principal user
        if (principalEmail && principalName) {
            const { hash } = await import('bcryptjs')
            const defaultPassword = `${name}@123`
            const hashedPassword = await hash(defaultPassword, 10)

            const [firstName, ...lastNames] = principalName.split(' ')
            const lastName = lastNames.join(' ') || 'Principal'

            await (prisma.user as any).create({
                data: {
                    email: principalEmail,
                    firstName,
                    lastName,
                    phoneNumber: principalPhone || phoneNumber,
                    password: hashedPassword,
                    role: 'PRINCIPAL',
                    schoolId: school.id,
                    requiresPasswordChange: true,
                }
            })
        }

        // Create audit log
        await prisma.auditLog.create({
            data: {
                action: 'SCHOOL_CREATED',
                entityType: 'School',
                entityId: school.id,
                userId: session.user.id,
                details: JSON.stringify({ school, principalEmail }),
            },
        })

        return NextResponse.json(school)
    } catch (error: any) {
        console.error('Failed to create school:', error)
        return new NextResponse(error.message || 'Internal Server Error', { status: 500 })
    }
}
