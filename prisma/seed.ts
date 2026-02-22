import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Starting database seed...')

    // Create Super Admin
    const superAdmin = await prisma.user.upsert({
        where: { email: 'garnet@paydesk.co.ke' },
        update: {},
        create: {
            email: 'garnet@paydesk.co.ke',
            password: await hash('garnet123', 12),
            role: 'SUPER_ADMIN',
            firstName: 'System',
            lastName: 'Administrator',
            phoneNumber: '254748938887',
            requiresPasswordChange: false,
        } as any,
    })
    console.log('✅ Created Super Admin:', superAdmin.email)

    // Create a sample school
    const school = await prisma.school.upsert({
        where: { code: 'DEMO001' },
        update: {},
        create: {
            name: 'Demo Secondary School',
            code: 'DEMO001',
            address: 'Nairobi, Kenya',
            phoneNumber: '254700000000',
            email: 'info@demoschool.ac.ke',
        },
    })
    console.log('✅ Created School:', school.name)

    // Create Principal
    const principal = await prisma.user.upsert({
        where: { email: 'paul@goodlife.ac.ke' },
        update: {
            firstName: 'Paul',
            lastName: 'Githinji',
            phoneNumber: '254711111111',
            role: 'PRINCIPAL',
            schoolId: school.id,
        },
        create: {
            email: 'paul@goodlife.ac.ke',
            password: await hash('paul123', 12),
            role: 'PRINCIPAL',
            firstName: 'Paul',
            lastName: 'Githinji',
            phoneNumber: '254711111111',
            schoolId: school.id,
            requiresPasswordChange: false,
        } as any,
    })
    console.log('✅ Created Principal:', principal.email)

    // Create Parent
    const parent = await prisma.user.upsert({
        where: { email: 'carol@gmail.com' },
        update: {},
        create: {
            email: 'carol@gmail.com',
            password: await hash('carol123', 12),
            role: 'PARENT',
            firstName: 'Carol',
            lastName: 'Githinji',
            phoneNumber: '254722222222',
            schoolId: school.id,
            requiresPasswordChange: false,
        } as any,
    })
    console.log('✅ Created Parent:', parent.email)

    // Create Classes
    const form1 = await prisma.class.upsert({
        where: {
            schoolId_name_stream: {
                schoolId: school.id,
                name: 'Form 1',
                stream: 'A'
            }
        },
        update: {},
        create: {
            name: 'Form 1',
            stream: 'A',
            capacity: 40,
            schoolId: school.id,
        },
    })
    console.log('✅ Created Class: Form 1 A')

    const form2 = await prisma.class.upsert({
        where: {
            schoolId_name_stream: {
                schoolId: school.id,
                name: 'Form 2',
                stream: 'A'
            }
        },
        update: {},
        create: {
            name: 'Form 2',
            stream: 'A',
            capacity: 40,
            schoolId: school.id,
        },
    })
    console.log('✅ Created Class: Form 2 A')

    // Create Students
    const student1 = await prisma.student.upsert({
        where: {
            schoolId_admissionNumber: {
                schoolId: school.id,
                admissionNumber: 'STD001'
            }
        },
        update: {},
        create: {
            admissionNumber: 'STD001',
            firstName: 'Deborah',
            lastName: 'Githinji',
            gender: 'Female',
            dateOfBirth: new Date('2003-04-24'),
            schoolId: school.id,
            classId: form1.id,
        },
    })

    await prisma.studentGuardian.upsert({
        where: { studentId_userId: { studentId: student1.id, userId: parent.id } },
        update: {
            relationship: 'Mother',
            isPrimary: true
        },
        create: {
            studentId: student1.id,
            userId: parent.id,
            relationship: 'Mother',
            isPrimary: true
        }
    })
    console.log('✅ Created Student:', student1.firstName, student1.lastName)

    const student2 = await prisma.student.upsert({
        where: {
            schoolId_admissionNumber: {
                schoolId: school.id,
                admissionNumber: 'STD002'
            }
        },
        update: {},
        create: {
            admissionNumber: 'STD002',
            firstName: 'Marcus',
            lastName: 'Micwe',
            gender: 'Male',
            dateOfBirth: new Date('1999-07-31'),
            schoolId: school.id,
            classId: form1.id,
        },
    })

    await prisma.studentGuardian.upsert({
        where: { studentId_userId: { studentId: student2.id, userId: parent.id } },
        update: {
            relationship: 'Father',
            isPrimary: true
        },
        create: {
            studentId: student2.id,
            userId: parent.id,
            relationship: 'Father',
            isPrimary: true
        }
    })
    console.log('✅ Created Student:', student2.firstName, student2.lastName)

    // Create Academic Period
    const academicPeriod = await prisma.academicPeriod.upsert({
        where: {
            schoolId_academicYear_term: {
                schoolId: school.id,
                academicYear: '2026',
                term: 'TERM_1'
            }
        },
        update: {},
        create: {
            schoolId: school.id,
            academicYear: '2026',
            term: 'TERM_1',
            startDate: new Date('2026-01-01'),
            endDate: new Date('2026-04-30'),
            isActive: true
        }
    })
    console.log('✅ Created Academic Period:', academicPeriod.term, academicPeriod.academicYear)

    // Create Fee Structures
    const tuitionFee = await prisma.feeStructure.upsert({
        where: { id: 'tuition-fee-demo' },
        update: {},
        create: {
            id: 'tuition-fee-demo',
            name: 'Tuition Fee',
            description: 'Term 1 Tuition Fee',
            amount: 25000,
            academicPeriodId: academicPeriod.id,
            schoolId: school.id,
            classId: form1.id,
        },
    })
    console.log('✅ Created Fee Structure:', tuitionFee.name)

    const boardingFee = await prisma.feeStructure.upsert({
        where: { id: 'boarding-fee-demo' },
        update: {},
        create: {
            id: 'boarding-fee-demo',
            name: 'Boarding Fee',
            description: 'Term 1 Boarding Fee',
            amount: 15000,
            academicPeriodId: academicPeriod.id,
            schoolId: school.id,
            classId: form1.id,
        },
    })
    console.log('✅ Created Fee Structure:', boardingFee.name)

    // Create Invoices
    const invoice1 = await prisma.invoice.upsert({
        where: { schoolId_invoiceNumber: { schoolId: school.id, invoiceNumber: 'INV-2026-001' } },
        update: {},
        create: {
            invoiceNumber: 'INV-2026-001',
            totalAmount: 40000,
            paidAmount: 15000,
            balance: 25000,
            status: 'PARTIALLY_PAID',
            academicPeriodId: academicPeriod.id,
            dueDate: new Date('2026-03-31'),
            schoolId: school.id,
            studentId: student1.id,
            feeStructureId: tuitionFee.id,
        },
    })
    console.log('✅ Created Invoice:', invoice1.invoiceNumber)

    const invoice2 = await prisma.invoice.upsert({
        where: { schoolId_invoiceNumber: { schoolId: school.id, invoiceNumber: 'INV-2026-002' } },
        update: {},
        create: {
            invoiceNumber: 'INV-2026-002',
            totalAmount: 40000,
            paidAmount: 0,
            balance: 40000,
            status: 'PENDING',
            academicPeriodId: academicPeriod.id,
            dueDate: new Date('2026-03-31'),
            schoolId: school.id,
            studentId: student2.id,
            feeStructureId: tuitionFee.id,
        },
    })
    console.log('✅ Created Invoice:', invoice2.invoiceNumber)

    // Create a sample payment
    const existingPayment = await prisma.payment.findUnique({
        where: { schoolId_transactionRef: { schoolId: school.id, transactionRef: 'TXN-2026-001' } }
    })

    if (!existingPayment) {
        const payment = await prisma.payment.create({
            data: {
                transactionRef: 'TXN-2026-001',
                amount: 15000,
                method: 'MPESA',
                status: 'COMPLETED',
                payerName: 'John Kamau',
                payerPhone: '254722222222',
                receiptNumber: 'RCT-2026-001',
                completedAt: new Date(),
                schoolId: school.id,
                studentId: student1.id,
                invoiceId: invoice1.id,
            },
        })
        console.log('✅ Created Payment:', payment.transactionRef)
    }

    console.log('\n🎉 Database seeded successfully!')
    console.log('\n📝 Login Credentials:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('Super Admin:')
    console.log('  Email: garnet@paydesk.co.ke')
    console.log('  Password: garnet123')
    console.log('\nPrincipal:')
    console.log('  Email: paul@goodlife.ac.ke')
    console.log('  Password: paul123')
    console.log('\nParent:')
    console.log('  Email: carol@gmail.com')
    console.log('  Password: carol123')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
}

main()
    .catch((e) => {
        console.error('❌ Error seeding database:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
