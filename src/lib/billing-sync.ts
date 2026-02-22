import { prisma } from './prisma'

/**
 * Synchronizes invoices with changes in fee structures.
 * This ensures that when a fee is added, updated, or removed, 
 * student invoices reflect the changes immediately.
 */
export async function syncInvoicesWithFeeStructure(feeStructureId: string) {
    console.log(`[BillingSync] Starting sync for FeeStructure: ${feeStructureId}`)
    try {
        const feeStructure = await prisma.feeStructure.findUnique({
            where: { id: feeStructureId },
            include: { academicPeriod: true }
        })

        if (!feeStructure) {
            console.log(`[BillingSync] Fee structure ${feeStructureId} not found`)
            return
        }

        const { schoolId, classId, academicPeriodId, amount, name, description, category, isActive } = feeStructure as any

        // 1. Identify all target students
        // If classId is null, it applies to all students in the school
        const students = await prisma.student.findMany({
            where: {
                schoolId,
                ...(classId && { classId }),
                status: 'ACTIVE'
            }
        })

        console.log(`Syncing fee structure ${feeStructureId} (${name}) with ${students.length} students`)

        for (const student of students) {
            // 2. Find or create an invoice for this period
            let invoice = await prisma.invoice.findFirst({
                where: {
                    studentId: student.id,
                    academicPeriodId: academicPeriodId
                },
                include: { items: true }
            })

            // If fee is active, ensure it's in the invoice
            if (isActive) {
                if (!invoice) {
                    // Create new invoice if it doesn't exist
                    invoice = await prisma.invoice.create({
                        data: {
                            invoiceNumber: `INV-${Date.now()}-${student.admissionNumber}`,
                            totalAmount: 0,
                            paidAmount: 0,
                            balance: 0,
                            status: 'PENDING',
                            schoolId,
                            studentId: student.id,
                            academicPeriodId,
                            dueDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
                            feeStructureId: feeStructureId
                        },
                        include: { items: true }
                    })
                }

                const existingItem = (invoice.items || []).find(item => item.feeStructureId === feeStructureId)

                if (existingItem) {
                    // Update existing item
                    await (prisma.invoiceItem as any).update({
                        where: { id: existingItem.id },
                        data: {
                            amount: amount,
                            unitPrice: amount,
                            description: description || name,
                            category: category
                        }
                    })
                } else {
                    // Add new item
                    await (prisma.invoiceItem as any).create({
                        data: {
                            invoiceId: invoice.id,
                            feeStructureId: feeStructureId,
                            description: description || name,
                            amount: amount,
                            unitPrice: amount,
                            category: category,
                            quantity: 1
                        }
                    })
                }
            } else {
                // Fee is INACTIVE - remove it from invoices if it exists
                if (invoice) {
                    const existingItem = (invoice.items || []).find(item => item.feeStructureId === feeStructureId)
                    if (existingItem) {
                        await prisma.invoiceItem.delete({
                            where: { id: existingItem.id }
                        })
                    }
                }
            }

            // 3. Recalculate invoice totals if invoice exists or was created
            if (invoice) {
                const refreshedInvoice = await prisma.invoice.findUnique({
                    where: { id: invoice.id },
                    include: { items: true }
                })

                if (refreshedInvoice) {
                    const totalAmount = refreshedInvoice.items.reduce((sum, item) => sum + Number(item.amount), 0)

                    const payments = await prisma.payment.aggregate({
                        where: { invoiceId: invoice.id, status: 'COMPLETED' },
                        _sum: { amount: true }
                    })

                    const paidAmount = Number(payments._sum.amount || 0)
                    const balance = totalAmount - paidAmount

                    await (prisma.invoice as any).update({
                        where: { id: invoice.id },
                        data: {
                            totalAmount,
                            paidAmount,
                            balance,
                            status: balance <= 0 && totalAmount > 0 ? 'PAID' : paidAmount > 0 ? 'PARTIALLY_PAID' : 'PENDING'
                        }
                    })
                }
            }
        }
    } catch (error) {
        console.error('Error syncing invoices with fee structure:', error)
        throw error
    }
}
