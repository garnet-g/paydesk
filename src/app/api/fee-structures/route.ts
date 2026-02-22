import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
    const session = await getServerSession(authOptions)

    if (!session) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    const { role, schoolId } = session.user
    const { searchParams } = new URL(req.url)
    const academicPeriodId = searchParams.get('academicPeriodId')
    const classId = searchParams.get('classId')
    const category = searchParams.get('category')

    try {
        let where: any = { isActive: true }

        if (role === 'PRINCIPAL') {
            where.schoolId = schoolId
        } else if (role === 'SUPER_ADMIN') {
            const schoolIdParam = searchParams.get('schoolId')
            if (schoolIdParam) {
                where.schoolId = schoolIdParam
            }
        } else {
            return new NextResponse('Forbidden', { status: 403 })
        }

        if (academicPeriodId) {
            where.academicPeriodId = academicPeriodId
        }

        if (classId) {
            where.OR = [
                { classId: classId },
                { classId: null } // Include general fees
            ]
        }

        if (category) {
            where.category = category
        }

        const feeStructures = await prisma.feeStructure.findMany({
            where,
            include: {
                class: true,
                academicPeriod: true,
                school: {
                    select: {
                        name: true,
                        code: true
                    }
                }
            },
            orderBy: [
                { displayOrder: 'asc' } as any,
                { category: 'asc' } as any,
                { createdAt: 'desc' }
            ]
        })

        return NextResponse.json(feeStructures)
    } catch (error: any) {
        console.error('Failed to fetch fee structures:', error)
        return new NextResponse(error.message || 'Internal Server Error', { status: 500 })
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)

    if (!session || !['PRINCIPAL', 'SUPER_ADMIN'].includes(session.user.role)) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    try {
        const body = await req.json()
        const { name, description, amount, category, displayOrder, academicPeriodId, classId, applyToAllClasses } = body

        const schoolId = session.user.role === 'PRINCIPAL' ? session.user.schoolId : body.schoolId

        if (!schoolId) {
            return new NextResponse('School ID required', { status: 400 })
        }

        // Validate academic period belongs to school
        const academicPeriod = await prisma.academicPeriod.findFirst({
            where: { id: academicPeriodId, schoolId }
        })

        if (!academicPeriod) {
            return new NextResponse('Invalid academic period', { status: 400 })
        }

        // If applyToAllClasses is true, create fee structure for all classes
        if (applyToAllClasses) {
            const classes = await prisma.class.findMany({
                where: { schoolId }
            })

            const feeStructures = await Promise.all(
                classes.map(cls =>
                    prisma.feeStructure.create({
                        data: {
                            name,
                            description,
                            amount: parseFloat(amount),
                            category: (category as any) || 'OTHER',
                            displayOrder: displayOrder || 0,
                            schoolId,
                            academicPeriodId,
                            classId: cls.id
                        }
                    })
                )
            )

            // Sync each new fee structure with invoices
            const { syncInvoicesWithFeeStructure } = await import('@/lib/billing-sync')
            await Promise.all(feeStructures.map(fs => syncInvoicesWithFeeStructure(fs.id)))

            return NextResponse.json({
                success: true,
                count: feeStructures.length,
                feeStructures
            })
        }

        // Create single fee structure
        const feeStructure = await prisma.feeStructure.create({
            data: {
                name,
                description,
                amount: parseFloat(amount),
                category: (category as any) || 'OTHER',
                displayOrder: displayOrder || 0,
                schoolId,
                academicPeriodId,
                classId: classId || null
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
        console.error('Failed to create fee structure:', error)
        return new NextResponse(error.message || 'Internal Server Error', { status: 500 })
    }
}
