import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'


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
        const student = await prisma.student.findUnique({
            where: { id: params.id },
            include: {
                class: true,
                school: true,
                guardians: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                                phoneNumber: true
                            }
                        }
                    }
                }
            }
        })

        if (!student) {
            return new NextResponse('Student not found', { status: 404 })
        }

        return NextResponse.json(student)
    } catch (error) {
        return new NextResponse('Internal Server Error', { status: 500 })
    }
}

export async function PATCH(
    req: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'PRINCIPAL') {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    try {
        const id = params.id
        const data = await req.json()

        const updatedStudent = await prisma.$transaction(async (tx) => {
            console.log(`[PATCH Student] Updating student ${id}`, data)

            const student = await tx.student.update({
                where: { id, schoolId: session.user.schoolId! },
                data: {
                    firstName: data.firstName,
                    lastName: data.lastName,
                    middleName: data.middleName,
                    gender: data.gender,
                    dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
                    status: data.status,
                    classId: data.classId,
                }
            })

            console.log(`[PATCH Student] Data fields updated for ${id}`)

            if (data.parentEmail && data.parentEmail.trim() !== "") {
                const trimmedEmail = data.parentEmail.trim()
                console.log(`[PATCH Student] Attempting to link parent: ${trimmedEmail}`)
                const parent = await tx.user.findFirst({
                    where: {
                        email: { equals: trimmedEmail, mode: 'insensitive' },
                        role: 'PARENT'
                    }
                })

                if (parent) {
                    // Clear existing primary guardians first
                    await tx.studentGuardian.deleteMany({
                        where: { studentId: id, isPrimary: true }
                    })

                    // Upsert the new one
                    await tx.studentGuardian.upsert({
                        where: {
                            studentId_userId: {
                                studentId: id,
                                userId: parent.id
                            }
                        },
                        create: {
                            studentId: id,
                            userId: parent.id,
                            relationship: 'Guardian',
                            isPrimary: true,
                        },
                        update: {
                            relationship: 'Guardian',
                            isPrimary: true,
                        }
                    })
                    console.log(`[PATCH Student] Guardianship created/updated for parent ${parent.id}`)
                } else {
                    console.error(`[PATCH Student] Parent with email ${trimmedEmail} not found for student ${id}`)
                    throw new Error(`Parent account with email "${trimmedEmail}" not found. Please register the parent first.`)
                }
            } else if (data.parentEmail === "") {
                console.log(`[PATCH Student] parentEmail is empty string, clearing guardianship for ${id}`)
                await tx.studentGuardian.deleteMany({
                    where: { studentId: id, isPrimary: true }
                })
            }

            // Return student with relations for UI sync
            return tx.student.findUnique({
                where: { id },
                include: {
                    class: true,
                    guardians: {
                        include: {
                            user: true
                        }
                    }
                }
            })
        })

        return NextResponse.json(updatedStudent)
    } catch (error: any) {
        console.error('Failed to update student:', error)
        return new NextResponse(error.message || 'Internal Server Error', { status: 500 })
    }
}

export async function DELETE(
    req: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'PRINCIPAL') {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    try {
        const id = params.id

        // Ensure student belongs to school
        const student = await prisma.student.findUnique({
            where: { id }
        })

        if (!student || student.schoolId !== session.user.schoolId) {
            return new NextResponse('Student not found', { status: 404 })
        }

        await prisma.student.delete({
            where: { id }
        })

        return new NextResponse(null, { status: 204 })
    } catch (error: any) {
        console.error('Failed to delete student:', error)
        return new NextResponse(error.message || 'Internal Server Error', { status: 500 })
    }
}
