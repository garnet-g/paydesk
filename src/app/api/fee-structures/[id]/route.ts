import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions)

    if (!session || !['PRINCIPAL', 'SUPER_ADMIN'].includes(session.user.role)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { id } = await params
        const body = await req.json()
        const { name, description, amount, category, displayOrder, isActive } = body

        // Verify fee structure belongs to user's school (for principals)
        if (session.user.role === 'PRINCIPAL') {
            const existing = await prisma.feeStructure.findFirst({
                where: { id, schoolId: session.user.schoolId as string }
            })

            if (!existing) {
                return new NextResponse('Fee structure not found', { status: 404 })
            }
        }

        const feeStructure = await prisma.feeStructure.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(description !== undefined && { description }),
                ...(amount !== undefined && { amount: parseFloat(amount) }),
                ...(category && { category }),
                ...(displayOrder !== undefined && { displayOrder }),
                ...(isActive !== undefined && { isActive })
            },
            include: {
                class: true,
                academicPeriod: true
            }
        })

        // Sync with invoices
        const { syncInvoicesWithFeeStructure } = await import('@/lib/billing-sync')
        await syncInvoicesWithFeeStructure(feeStructure.id)

        return NextResponse.json(feeStructure)
    } catch (error: any) {
        console.error('Failed to update fee structure:', error)
        return new NextResponse(error.message || 'Internal Server Error', { status: 500 })
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions)

    if (!session || !['PRINCIPAL', 'SUPER_ADMIN'].includes(session.user.role)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { id } = await params

        // Verify fee structure belongs to user's school (for principals)
        if (session.user.role === 'PRINCIPAL') {
            const schoolId = session.user.schoolId as string
            const existing = await prisma.feeStructure.findFirst({
                where: { id, schoolId }
            })

            if (!existing) {
                return new NextResponse('Fee structure not found', { status: 404 })
            }
        }

        // Soft delete by setting isActive to false
        const feeStructure = await prisma.feeStructure.update({
            where: { id },
            data: { isActive: false }
        })

        // Sync with invoices (removes the fee from existing invoices)
        const { syncInvoicesWithFeeStructure } = await import('@/lib/billing-sync')
        await syncInvoicesWithFeeStructure(feeStructure.id)

        return NextResponse.json({ success: true, feeStructure })
    } catch (error: any) {
        console.error('Failed to delete fee structure:', error)
        return new NextResponse(error.message || 'Internal Server Error', { status: 500 })
    }
}
