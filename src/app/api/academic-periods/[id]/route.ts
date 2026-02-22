import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
    req: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'PRINCIPAL' && session.user.role !== 'SUPER_ADMIN')) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    try {
        const id = params.id
        const body = await req.json()
        const { isActive } = body

        // If activating, deactivate all others first
        if (isActive) {
            await prisma.academicPeriod.updateMany({
                where: {
                    schoolId: session.user.schoolId!,
                    isActive: true,
                    id: { not: id } // Don't deactivate self if already active (redundant but safe)
                },
                data: { isActive: false }
            })
        }

        const updatedPeriod = await prisma.academicPeriod.update({
            where: { id },
            data: {
                isActive
                // Add other fields update logic if needed
            }
        })

        return NextResponse.json(updatedPeriod)
    } catch (error: any) {
        console.error('Failed to update academic period:', error)
        return new NextResponse(error.message || 'Internal Server Error', { status: 500 })
    }
}

export async function DELETE(
    req: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'PRINCIPAL' && session.user.role !== 'SUPER_ADMIN')) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    try {
        const id = params.id
        await prisma.academicPeriod.delete({
            where: { id }
        })
        return new NextResponse(null, { status: 204 })
    } catch (error: any) {
        // If related records exist (invoices), this will fail due to constraints
        return new NextResponse('Cannot delete period with associated data', { status: 400 })
    }
}
