import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions)

    if (!session || ((session.user.role !== 'PRINCIPAL' && session.user.role !== 'FINANCE_MANAGER') && session.user.role !== 'SUPER_ADMIN')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { id: invoiceId } = await params
        const { description, amount, category } = await req.json()

        if (!description || !amount) {
            return new NextResponse('Description and amount are required', { status: 400 })
        }

        const invoice = await prisma.invoice.findUnique({
            where: { id: invoiceId },
            include: { school: true }
        })

        if (!invoice) {
            return new NextResponse('Invoice not found', { status: 404 })
        }

        if (session.user.role === 'PRINCIPAL' && invoice.schoolId !== session.user.schoolId) {
            return new NextResponse('Unauthorized', { status: 403 })
        }

        // Transaction to add item and update invoice totals
        const updatedInvoice = await prisma.$transaction(async (tx) => {
            // Create item
            const newItem = await tx.invoiceItem.create({
                data: {
                    invoiceId,
                    description,
                    amount: parseFloat(amount),
                    category: category || 'OTHER',
                    quantity: 1,
                    unitPrice: parseFloat(amount)
                } as any
            })

            // Update invoice totals
            const itemAmount = parseFloat(amount.toString()) // Ensure number

            const updated = await tx.invoice.update({
                where: { id: invoiceId },
                data: {
                    totalAmount: { increment: itemAmount },
                    balance: { increment: itemAmount }
                },
                include: {
                    items: true,
                    student: true,
                    academicPeriod: true
                }
            })

            return updated
        })

        // Audit log
        await prisma.auditLog.create({
            data: {
                action: 'INVOICE_ITEM_ADDED',
                entityType: 'Invoice',
                entityId: invoiceId,
                userId: session.user.id,
                schoolId: invoice.schoolId,
                details: JSON.stringify({ description, amount, category }),
            },
        })

        return NextResponse.json(updatedInvoice)
    } catch (error: any) {
        console.error('Failed to add invoice item:', error)
        return new NextResponse(error.message || 'Internal Server Error', { status: 500 })
    }
}
