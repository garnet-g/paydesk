import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions)
    const { id } = await params

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Role check: Only SUPER_ADMIN or PRINCIPAL of this school
    if (session.user.role !== 'SUPER_ADMIN' && (session.user.role !== 'PRINCIPAL' || session.user.schoolId !== id)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    try {
        const { logoUrl, primaryColor, secondaryColor, tagline } = await req.json()

        const school = await prisma.school.update({
            where: { id },
            data: {
                logoUrl,
                primaryColor,
                secondaryColor,
                tagline
            }
        })

        // Create audit log
        await prisma.auditLog.create({
            data: {
                action: 'SCHOOL_BRANDING_UPDATED',
                entityType: 'School',
                entityId: school.id,
                userId: session.user.id,
                schoolId: school.id,
                details: JSON.stringify({ logoUrl, primaryColor, secondaryColor, tagline }),
            },
        })

        return NextResponse.json(school)
    } catch (error: any) {
        console.error('Failed to update school branding:', error)
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}
