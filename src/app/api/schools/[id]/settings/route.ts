import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions)
    const { id } = await params

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'SUPER_ADMIN' && (session.user.role !== 'PRINCIPAL' || session.user.schoolId !== id)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    try {
        const school = await prisma.school.findUnique({
            where: { id }
        })
        return NextResponse.json(school)
    } catch (error) {
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 })
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions)
    const { id } = await params

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'SUPER_ADMIN' && (session.user.role !== 'PRINCIPAL' || session.user.schoolId !== id)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    try {
        const data = await req.json()
        const {
            name,
            motto,
            phoneNumber,
            email,
            address,
            mpesaPaybill,
            bankName,
            bankAccount,
            bankAccountName,
            bankBranch,
            currentTerm,
            currentYear,
            planTier
        } = data

        const school = await prisma.school.update({
            where: { id },
            data: {
                name,
                motto,
                phoneNumber,
                email,
                address,
                mpesaPaybill,
                bankName,
                bankAccount,
                bankAccountName,
                bankBranch,
                currentTerm,
                currentYear,
                planTier
            }
        })

        // Create audit log
        await prisma.auditLog.create({
            data: {
                action: 'SCHOOL_SETTINGS_UPDATED',
                entityType: 'School',
                entityId: school.id,
                userId: session.user.id,
                schoolId: school.id,
                details: JSON.stringify(data),
            },
        })

        return NextResponse.json(school)
    } catch (error: any) {
        console.error('Failed to update school settings:', error)
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}
