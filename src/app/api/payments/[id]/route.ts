import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'SUPER_ADMIN' && (session.user.role !== 'PRINCIPAL' && session.user.role !== 'FINANCE_MANAGER'))) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    try {
        const { id } = await params
        const { status, notes } = await req.json()

        const payment = await prisma.payment.update({
            where: { id },
            data: {
                status: status || undefined,
                notes: notes || undefined,
            },
        })

        // Also update invoice balance if status is changed to COMPLETED or REFUNDED/DISPUTED
        // For now, keep it simple.

        return NextResponse.json(payment)
    } catch (error: any) {
        console.error('Failed to update payment:', error)
        return new NextResponse(error.message || 'Internal Server Error', { status: 500 })
    }
}
