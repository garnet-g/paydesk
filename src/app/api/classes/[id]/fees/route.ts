import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export async function GET(
    req: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'PRINCIPAL' && session.user.role !== 'SUPER_ADMIN')) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    try {
        const classId = params.id

        const activePeriod = await prisma.academicPeriod.findFirst({
            where: {
                schoolId: session.user.schoolId!,
                isActive: true
            }
        })

        if (!activePeriod) {
            return NextResponse.json({ fees: [], error: 'No active academic period found' })
        }

        const fees = await prisma.feeStructure.findMany({
            where: {
                schoolId: session.user.schoolId!,
                classId: classId,
                academicPeriodId: activePeriod.id
            },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json({ fees, activePeriod })
    } catch (error: any) {
        console.error('Failed to fetch class fees:', error)
        return new NextResponse(error.message || 'Internal Server Error', { status: 500 })
    }
}

export async function POST(
    req: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'PRINCIPAL' && session.user.role !== 'SUPER_ADMIN')) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    try {
        const classId = params.id
        const body = await req.json()
        const { name, amount, category, applyToGrade } = body

        if (!name || !amount) {
            return new NextResponse('Name and amount are required', { status: 400 })
        }

        // 1. Find active academic period
        const activePeriod = await prisma.academicPeriod.findFirst({
            where: {
                schoolId: session.user.schoolId!,
                isActive: true
            }
        })

        if (!activePeriod) {
            return new NextResponse('No active academic period found. Please set one up.', { status: 400 })
        }

        const feeAmount = parseFloat(amount.toString())

        await prisma.$transaction(async (tx) => {
            let targetClasses = [classId]

            if (applyToGrade) {
                const targetClass = await tx.class.findUnique({ where: { id: classId } })
                if (targetClass) {
                    const siblingClasses = await tx.class.findMany({
                        where: {
                            schoolId: session.user.schoolId!,
                            name: targetClass.name
                        }
                    })
                    targetClasses = siblingClasses.map(c => c.id)
                }
            }

            // Create Fee Structures for each class
            const createdFees = await Promise.all(
                targetClasses.map(clsId =>
                    tx.feeStructure.create({
                        data: {
                            name,
                            amount: feeAmount,
                            category: category || 'TUITION',
                            classId: clsId,
                            schoolId: session.user.schoolId!,
                            academicPeriodId: activePeriod.id,
                        }
                    })
                )
            )

            // 2. AUTOMATIC RECEIVABLES: Find all students in these classes and update/create invoices
            const students = await tx.student.findMany({
                where: {
                    classId: { in: targetClasses },
                    status: 'ACTIVE'
                }
            })

            for (const student of students) {
                // Find matching fee structure for this student's class
                const studentClassFee = createdFees.find(f => f.classId === student.classId)
                if (!studentClassFee) continue

                // Find existing pending invoice for this period
                let invoice = await tx.invoice.findFirst({
                    where: {
                        studentId: student.id,
                        academicPeriodId: activePeriod.id,
                        status: 'PENDING'
                    }
                })

                if (invoice) {
                    // Add item to existing invoice
                    await tx.invoiceItem.create({
                        data: {
                            description: studentClassFee.name,
                            amount: new Prisma.Decimal(studentClassFee.amount),
                            unitPrice: new Prisma.Decimal(studentClassFee.amount),
                            quantity: 1,
                            category: studentClassFee.category,
                            invoiceId: invoice.id,
                            feeStructureId: studentClassFee.id
                        }
                    })

                    // Update invoice totals
                    await tx.invoice.update({
                        where: { id: invoice.id },
                        data: {
                            totalAmount: { increment: new Prisma.Decimal(studentClassFee.amount) },
                            balance: { increment: new Prisma.Decimal(studentClassFee.amount) }
                        }
                    })
                } else {
                    // Create new invoice
                    const count = await tx.invoice.count({
                        where: { schoolId: session.user.schoolId! }
                    })
                    const invoiceNumber = `INV-${activePeriod.academicYear}-${(count + 1).toString().padStart(4, '0')}`

                    await tx.invoice.create({
                        data: {
                            invoiceNumber,
                            totalAmount: new Prisma.Decimal(studentClassFee.amount),
                            paidAmount: 0,
                            balance: new Prisma.Decimal(studentClassFee.amount),
                            status: 'PENDING',
                            academicPeriodId: activePeriod.id,
                            schoolId: session.user.schoolId!,
                            studentId: student.id,
                            dueDate: activePeriod.endDate,
                            items: {
                                create: [{
                                    description: studentClassFee.name,
                                    amount: new Prisma.Decimal(studentClassFee.amount),
                                    unitPrice: new Prisma.Decimal(studentClassFee.amount),
                                    quantity: 1,
                                    category: studentClassFee.category,
                                    feeStructureId: studentClassFee.id
                                }]
                            }
                        }
                    })
                }
            }
        })

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Failed to create fee and update receivables:', error)
        return new NextResponse(error.message || 'Internal Server Error', { status: 500 })
    }
}
