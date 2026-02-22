import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions)
    if (!session) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    try {
        const { id: studentId } = await params

        // Fetch all invoices for the student to get current balances
        const invoices = await prisma.invoice.findMany({
            where: { studentId },
            select: {
                totalAmount: true,
                paidAmount: true,
                balance: true,
            }
        })

        // We calculate overall balance by summing individual invoice balances.
        // This ensures the summary matches the sum of what's shown in the invoice list.
        const totalInvoiced = invoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0)
        const totalPaid = invoices.reduce((sum, inv) => sum + Number(inv.paidAmount), 0)
        const overallBalance = invoices.reduce((sum, inv) => sum + Number(inv.balance), 0)

        return NextResponse.json({
            totalInvoiced,
            totalPaid,
            overallBalance,
            invoiceCount: invoices.length,
        })
    } catch (error: any) {
        console.error('Failed to fetch student billing summary:', error)
        return new NextResponse(error.message || 'Internal Server Error', { status: 500 })
    }
}
