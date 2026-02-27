import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
    const session = await getServerSession(authOptions)

    if (!session || ((session.user.role !== 'PRINCIPAL' && session.user.role !== 'FINANCE_MANAGER') && session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'PARENT')) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    let where: any = {}
    if (session.user.role === 'PRINCIPAL' || session.user.role === 'FINANCE_MANAGER') {
        where.schoolId = session.user.schoolId!
    } else if (session.user.role === 'PARENT') {
        // Find students where this user is a guardian
        where.guardians = {
            some: {
                userId: session.user.id
            }
        }
    }

    const students = await prisma.student.findMany({
        where,
        include: {
            class: true,
            school: true,
            guardians: {
                include: {
                    user: true
                }
            },
        },
        orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(students)
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'PRINCIPAL') {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    try {
        const data = await req.json()
        const { admissionNumber, firstName, lastName, middleName, gender, dateOfBirth, classId, parentEmail } = data

        const school = await prisma.school.findUnique({
            where: { id: session.user.schoolId! },
            select: { planTier: true, _count: { select: { students: true } } }
        });

        if (school && school.planTier === 'FREE' && school._count.students >= 200) {
            return new NextResponse('Free tier limit reached. Please upgrade to a PRO plan to add more than 200 students.', { status: 403 })
        }

        const student = await prisma.$transaction(async (tx) => {
            console.log(`[POST Student] Creating new student`, data)
            const newStudent = await tx.student.create({
                data: {
                    admissionNumber,
                    firstName,
                    lastName,
                    middleName,
                    gender,
                    dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
                    schoolId: session.user.schoolId!,
                    classId,
                },
            })

            console.log(`[POST Student] Created student ${newStudent.id}`)

            if (parentEmail) {
                const trimmedEmail = parentEmail.trim()
                console.log(`[POST Student] Attempting to link parent: ${trimmedEmail}`)
                const parent = await tx.user.findFirst({
                    where: {
                        email: { equals: trimmedEmail, mode: 'insensitive' },
                        role: 'PARENT'
                    }
                })

                if (parent) {
                    await tx.studentGuardian.create({
                        data: {
                            studentId: newStudent.id,
                            userId: parent.id,
                            relationship: 'Guardian',
                            isPrimary: true,
                        }
                    })
                    console.log(`[POST Student] Guardianship created for parent ${parent.id}`)
                } else {
                    console.error(`[POST Student] Parent with email ${trimmedEmail} not found or not a PARENT`)
                    throw new Error(`Failed to link parent: ${trimmedEmail}. Ensure the parent is registered first.`)
                }
            }

            // Automatic Invoice Generation
            // 1. Find active academic period
            const activePeriod = await tx.academicPeriod.findFirst({
                where: {
                    schoolId: session.user.schoolId!,
                    isActive: true
                }
            })

            // 2. If active period and class assigned, find applicable fees
            if (activePeriod && classId) {
                const feeStructures = await tx.feeStructure.findMany({
                    where: {
                        schoolId: session.user.schoolId!,
                        academicPeriodId: activePeriod.id,
                        OR: [
                            { classId: classId }, // Fees specific to this class
                            { classId: null }     // School-wide fees
                        ]
                    }
                })

                if (feeStructures.length > 0) {
                    // Calculate total
                    const totalAmount = feeStructures.reduce((sum, fee) => sum + fee.amount, 0)

                    // Generate Invoice Number (Simple sequential for now, can be improved)
                    const count = await tx.invoice.count({
                        where: { schoolId: session.user.schoolId! }
                    })
                    const invoiceNumber = `INV-${activePeriod.academicYear}-${(count + 1).toString().padStart(4, '0')}`

                    await tx.invoice.create({
                        data: {
                            invoiceNumber,
                            totalAmount,
                            paidAmount: 0,
                            balance: totalAmount,
                            status: 'PENDING',
                            academicPeriodId: activePeriod.id,
                            schoolId: session.user.schoolId!,
                            studentId: newStudent.id,
                            dueDate: activePeriod.endDate,
                            items: {
                                create: feeStructures.map((fee: any) => ({
                                    description: fee.name,
                                    amount: fee.amount,
                                    category: fee.category,
                                    feeStructureId: fee.id,
                                    unitPrice: fee.amount,
                                    quantity: 1
                                }))
                            }
                        }
                    })
                }
            }

            return newStudent
        })

        // Create audit log
        await prisma.auditLog.create({
            data: {
                action: 'STUDENT_ENROLLED',
                entityType: 'Student',
                entityId: student.id,
                userId: session.user.id,
                schoolId: session.user.schoolId,
                details: JSON.stringify(student),
            },
        })

        return NextResponse.json(student)
    } catch (error: any) {
        console.error('Failed to create student:', error)
        return new NextResponse(error.message || 'Internal Server Error', { status: 500 })
    }
}
