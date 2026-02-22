import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'PARENT') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { id } = await params
        const { isDismissed } = await req.json()

        // 1. Get Item and Invoice details using raw SQL to bypass stale Prisma Client metadata
        const items = await prisma.$queryRaw<any[]>`
            SELECT ii.*, i."studentId" as "invoiceStudentId"
            FROM "InvoiceItem" ii
            JOIN "Invoice" i ON ii."invoiceId" = i."id"
            WHERE ii."id" = ${id}
            LIMIT 1
        `
        const item = items[0]

        if (!item) {
            return NextResponse.json({ error: 'Item not found' }, { status: 404 })
        }

        const invoiceId = item.invoiceId

        // 2. Security check using standard prisma (should be fine as these tables didn't change schema)
        const sponsorship = await prisma.studentGuardian.findFirst({
            where: {
                userId: session.user.id,
                studentId: item.invoiceStudentId
            }
        })

        if (!sponsorship) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        if (item.category === 'TUITION' && isDismissed) {
            return NextResponse.json({ error: 'Mandatory fees cannot be dismissed' }, { status: 400 })
        }

        // 3. Update Item using raw SQL
        await prisma.$executeRawUnsafe(
            'UPDATE "InvoiceItem" SET "isDismissed" = $1 WHERE "id" = $2',
            isDismissed,
            id
        )

        // 4. Recalculate invoice total and balance using raw SQL for reliability
        const allItemsRaw = await prisma.$queryRaw<any[]>`
            SELECT amount, "isDismissed" FROM "InvoiceItem" WHERE "invoiceId" = ${invoiceId}
        `

        const activeItems = allItemsRaw.filter(i => !i.isDismissed)
        const totalAmount = activeItems.reduce((sum, i) => sum + Number(i.amount), 0)

        // Get completed payments
        const payments = await prisma.payment.aggregate({
            where: { invoiceId, status: 'COMPLETED' },
            _sum: { amount: true }
        })
        const paidAmount = Number(payments._sum.amount || 0)
        const balance = totalAmount - paidAmount

        // 5. Update Invoice
        const status = balance <= 0 && totalAmount > 0 ? 'PAID' : paidAmount > 0 ? 'PARTIALLY_PAID' : 'PENDING'

        await prisma.$executeRawUnsafe(
            'UPDATE "Invoice" SET "totalAmount" = $1, "balance" = $2, "status" = $3 WHERE "id" = $4',
            totalAmount,
            balance,
            status,
            invoiceId
        )

        // 6. Return the updated invoice manually constructed to avoid ANY prisma hydration issues
        const invoiceRaw = await prisma.$queryRaw<any[]>`
            SELECT i.*, s."firstName", s."lastName", s."admissionNumber"
            FROM "Invoice" i
            JOIN "Student" s ON i."studentId" = s."id"
            WHERE i."id" = ${invoiceId}
            LIMIT 1
        `
        const inv = invoiceRaw[0]

        const itemsRaw = await prisma.$queryRaw<any[]>`
            SELECT * FROM "InvoiceItem" 
            WHERE "invoiceId" = ${invoiceId}
            ORDER BY category ASC
        `

        const response = {
            ...inv,
            student: {
                firstName: inv.firstName,
                lastName: inv.lastName,
                admissionNumber: inv.admissionNumber
            },
            items: itemsRaw
        }

        return NextResponse.json(response)
    } catch (error: any) {
        console.error('Failed to update invoice item:', error)
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}

// Export DELETE for administrators to remove items
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== 'PRINCIPAL' && session.user.role !== 'SUPER_ADMIN')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { id } = await params

        // 1. Get Item and Invoice details
        const item = await prisma.invoiceItem.findUnique({
            where: { id },
            include: { invoice: true }
        })

        if (!item) {
            return NextResponse.json({ error: 'Item not found' }, { status: 404 })
        }

        const invoiceId = item.invoiceId

        // Security check
        if (session.user.role === 'PRINCIPAL' && item.invoice.schoolId !== session.user.schoolId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // 2. Perform Deletion and Update in a transaction
        const updatedInvoice = await prisma.$transaction(async (tx) => {
            // Delete the item
            await tx.invoiceItem.delete({
                where: { id }
            })

            // Recalculate totals
            const allItems = await tx.invoiceItem.findMany({
                where: { invoiceId, isDismissed: false }
            })

            const totalAmount = allItems.reduce((sum, i) => sum + Number(i.amount), 0)

            // Get paid amount
            const payments = await tx.payment.aggregate({
                where: { invoiceId, status: 'COMPLETED' },
                _sum: { amount: true }
            })
            const paidAmount = Number(payments._sum.amount || 0)
            const balance = totalAmount - paidAmount
            const status = balance <= 0 && totalAmount > 0 ? 'PAID' : paidAmount > 0 ? 'PARTIALLY_PAID' : 'PENDING'

            // Update Invoice
            return await tx.invoice.update({
                where: { id: invoiceId },
                data: {
                    totalAmount,
                    balance,
                    status
                },
                include: {
                    items: { orderBy: { category: 'asc' } },
                    student: { select: { firstName: true, lastName: true, admissionNumber: true } },
                    academicPeriod: true
                }
            })
        })

        return NextResponse.json(updatedInvoice)
    } catch (error: any) {
        console.error('Failed to delete invoice item:', error)
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}

