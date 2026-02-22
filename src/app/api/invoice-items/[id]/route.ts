import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// DELETE: Remove an item from invoice
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'PRINCIPAL' && session.user.role !== 'SUPER_ADMIN')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { id: itemId } = await params

        // Use raw SQL to get item and invoice details to bypass stale Prisma Client metadata
        const items = await prisma.$queryRaw<any[]>`
            SELECT ii.*, i."schoolId" as "invoiceSchoolId", i."paidAmount" as "invoicePaidAmount"
            FROM "InvoiceItem" ii
            JOIN "Invoice" i ON ii."invoiceId" = i."id"
            WHERE ii."id" = ${itemId}
            LIMIT 1
        `
        const item = items[0]

        if (!item) {
            return NextResponse.json({ error: 'Item not found' }, { status: 404 })
        }

        if (session.user.role === 'PRINCIPAL' && item.invoiceSchoolId !== session.user.schoolId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        const invoiceId = item.invoiceId

        // Transaction to delete item and update invoice totals
        // Note: Using standard prisma inside transaction for tables that didn't change schema
        // But use executeRaw for the deletion just to be safe if the client is really bad.
        const updatedInvoice = await prisma.$transaction(async (tx) => {
            // Delete item
            await tx.$executeRawUnsafe('DELETE FROM "InvoiceItem" WHERE id = $1', itemId)

            // Recalculate totals
            const remainingItems: any[] = await tx.$queryRawUnsafe(
                'SELECT amount FROM "InvoiceItem" WHERE "invoiceId" = $1 AND "isDismissed" = false',
                invoiceId
            )

            const newTotal = remainingItems.reduce((sum, i) => sum + Number(i.amount), 0)
            const newBalance = newTotal - Number(item.invoicePaidAmount)

            const updated = await (tx.invoice as any).update({
                where: { id: invoiceId },
                data: {
                    totalAmount: newTotal,
                    balance: newBalance
                },
                include: {
                    items: {
                        orderBy: { category: 'asc' } as any
                    }
                }
            })

            return updated
        })

        // Audit log
        await prisma.auditLog.create({
            data: {
                action: 'INVOICE_ITEM_REMOVED',
                entityType: 'InvoiceItem',
                entityId: itemId,
                userId: session.user.id,
                schoolId: item.invoiceSchoolId,
                details: JSON.stringify({ deletedAmount: item.amount, description: item.description }),
            },
        })

        return NextResponse.json(updatedInvoice)
    } catch (error: any) {
        console.error('Failed to remove invoice item:', error)
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}
