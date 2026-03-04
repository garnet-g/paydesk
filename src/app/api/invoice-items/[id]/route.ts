import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// DELETE: Remove an item from invoice and recompute all totals
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'PRINCIPAL' && session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'FINANCE_MANAGER')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { id: itemId } = await params

        // ── Fix #17: Use proper Prisma tagged template instead of $queryRawUnsafe ─
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

        if (session.user.role !== 'SUPER_ADMIN' && item.invoiceSchoolId !== session.user.schoolId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        const invoiceId = item.invoiceId

        const updatedInvoice = await prisma.$transaction(async (tx) => {
            // Delete item using safe tagged template
            await tx.$executeRaw`DELETE FROM "InvoiceItem" WHERE id = ${itemId}`

            // Recalculate totals from remaining active items
            const remainingItems = await tx.$queryRaw<{ amount: number }[]>`
                SELECT amount FROM "InvoiceItem"
                WHERE "invoiceId" = ${invoiceId} AND "isDismissed" = false
            `

            const newTotal = remainingItems.reduce((sum, i) => sum + Number(i.amount), 0)
            const paidAmount = Number(item.invoicePaidAmount)
            const newBalance = Math.max(0, newTotal - paidAmount)

            // ── Fix #6: Recalculate invoice status after item removal ─────────────
            const newStatus = newBalance <= 0 && newTotal > 0
                ? 'PAID'
                : paidAmount > 0 && newBalance > 0
                    ? 'PARTIALLY_PAID'
                    : newTotal === 0
                        ? 'CANCELLED'
                        : 'PENDING'

            const updated = await tx.invoice.update({
                where: { id: invoiceId },
                data: {
                    totalAmount: newTotal,
                    balance: newBalance,
                    status: newStatus
                },
                include: {
                    items: { where: { isDismissed: false }, orderBy: { category: 'asc' } }
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
