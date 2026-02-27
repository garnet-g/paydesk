import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'PRINCIPAL' && session.user.role !== 'SUPER_ADMIN')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const schoolId = session.user.schoolId
    if (!schoolId) {
        return NextResponse.json({ error: 'School ID not found' }, { status: 400 })
    }

    try {
        const formData = await req.formData()
        const file = formData.get('file') as File
        const type = formData.get('type') as string

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
        }

        const buffer = await file.arrayBuffer()
        const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const data = XLSX.utils.sheet_to_json(worksheet) as any[]

        let processed = 0
        let created = 0
        let errors = 0

        if (type === 'STUDENTS') {
            const school = await prisma.school.findUnique({
                where: { id: schoolId },
                select: { planTier: true, _count: { select: { students: true } } }
            });
            const isFreeTier = school?.planTier === 'FREE';
            let currentStudentCount = school?._count.students || 0;

            for (const row of data) {
                processed++
                try {
                    // Normalize keys (handle case sensitivity and spaces)
                    const admNo = (row['Admission Number'] || row['AdmNo'] || row['admissionNumber'] || row['adm_no'] || row['admission_number'])?.toString().trim()
                    const firstName = row['First Name'] || row['firstName'] || row['first_name']
                    const lastName = row['Last Name'] || row['lastName'] || row['last_name']
                    const className = row['Class'] || row['className'] || row['class_name']
                    const stream = row['Stream'] || row['stream'] || ''

                    if (!admNo || !firstName) {
                        errors++
                        continue
                    }

                    const existingStudent = await prisma.student.findUnique({
                        where: { schoolId_admissionNumber: { schoolId, admissionNumber: admNo } }
                    })

                    if (!existingStudent && isFreeTier && currentStudentCount >= 200) {
                        return NextResponse.json({ error: 'Free tier limit reached. Please upgrade to a PRO plan to add more than 200 students.' }, { status: 403 })
                    }

                    // Find or create class
                    let classId = null
                    if (className) {
                        const cls = await prisma.class.findFirst({
                            where: { schoolId, name: className.trim(), stream: stream.toString().trim() }
                        })
                        if (cls) {
                            classId = cls.id
                        } else {
                            const newCls = await prisma.class.create({
                                data: { schoolId, name: className.trim(), stream: stream.toString().trim() }
                            })
                            classId = newCls.id
                        }
                    }

                    // Upsert student
                    await prisma.student.upsert({
                        where: { schoolId_admissionNumber: { schoolId, admissionNumber: admNo } },
                        update: { firstName, lastName, classId },
                        create: { schoolId, admissionNumber: admNo, firstName, lastName, classId }
                    })
                    if (!existingStudent) currentStudentCount++
                    created++
                } catch (err) {
                    console.error("Student Import Row Error:", err)
                    errors++
                }
            }
        } else if (type === 'PARENTS') {
            for (const row of data) {
                processed++
                try {
                    const email = (row['Email'] || row['email'])?.toString().trim().toLowerCase()
                    const phone = (row['Phone'] || row['phone'] || row['phone_number'] || row['phoneNumber'])?.toString().trim()
                    const firstName = row['First Name'] || row['firstName'] || row['first_name'] || 'Parent'
                    const lastName = row['Last Name'] || row['lastName'] || row['last_name'] || ''
                    const studentAdmNo = (row['Student AdmNo'] || row['student_adm_no'] || row['Student Admission Number'] || row['studentAdmNo'])?.toString().trim()

                    if (!email || !studentAdmNo) {
                        errors++
                        continue
                    }

                    const tempPassword = 'TemporaryPassword123!'
                    const bcrypt = await import('bcryptjs')
                    const hashedPassword = await bcrypt.hash(tempPassword, 10)

                    // Track if user is newly created for notification
                    const existingUser = await prisma.user.findUnique({ where: { email } })

                    const parent = await prisma.user.upsert({
                        where: { email },
                        update: { phoneNumber: phone },
                        create: {
                            email,
                            password: hashedPassword,
                            firstName,
                            lastName,
                            phoneNumber: phone,
                            role: 'PARENT',
                            schoolId
                        }
                    })

                    // Trigger safe notification if new
                    if (!existingUser) {
                        try {
                            const { CommunicationEngine } = await import('@/lib/communication')
                            CommunicationEngine.notifyParentAccountCreated(parent.id, tempPassword)
                        } catch (err) {
                            console.error("Welcome Notification Error:", err)
                        }
                    }

                    // Link to student
                    const student = await prisma.student.findFirst({
                        where: { schoolId, admissionNumber: studentAdmNo }
                    })

                    if (student) {
                        await prisma.studentGuardian.upsert({
                            where: { studentId_userId: { studentId: student.id, userId: parent.id } },
                            update: {},
                            create: { studentId: student.id, userId: parent.id, relationship: 'Parent' }
                        })
                        created++
                    } else {
                        errors++
                    }
                } catch (err) {
                    errors++
                }
            }
        } else if (type === 'BALANCES') {
            // Opening balance logic: Create an invoice if it doesn't exist or add item to current
            const period = await prisma.academicPeriod.findFirst({ where: { schoolId, isActive: true } })
            if (!period) throw new Error("No active academic period for balance import")

            for (const row of data) {
                processed++
                try {
                    const admNo = row['Admission Number'] || row['AdmNo']
                    const balanceAmount = parseFloat(row['Balance'] || row['Amount'])

                    if (!admNo || isNaN(balanceAmount)) {
                        errors++
                        continue
                    }

                    const student = await prisma.student.findFirst({ where: { schoolId, admissionNumber: admNo.toString().trim() } })
                    if (!student) {
                        errors++
                        continue
                    }

                    // Create "Previous Balance" Invoice
                    await prisma.invoice.create({
                        data: {
                            invoiceNumber: `BAL-PREV-${student.admissionNumber}-${Date.now().toString().slice(-4)}`,
                            totalAmount: balanceAmount,
                            paidAmount: 0,
                            balance: balanceAmount,
                            status: 'PENDING',
                            schoolId,
                            studentId: student.id,
                            academicPeriodId: period.id,
                            dueDate: new Date(),
                            items: {
                                create: [{
                                    description: 'Brought Forward / Previous Balance',
                                    amount: balanceAmount,
                                    category: 'OTHER',
                                    quantity: 1,
                                    unitPrice: balanceAmount
                                }]
                            }
                        }
                    })
                    created++
                } catch (err) {
                    errors++
                }
            }
        }

        return NextResponse.json({
            success: true,
            message: `Processed ${processed} rows.`,
            details: { processed, created, errors }
        })

    } catch (error: any) {
        console.error('Import process error:', error)
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}
