
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const users = await prisma.user.count()
    const schools = await prisma.school.count()
    const classes = await prisma.class.count()
    const students = await prisma.student.count()
    const feeStructures = await prisma.feeStructure.count()
    const invoices = await prisma.invoice.count()
    const payments = await prisma.payment.count()

    console.log('COUNT_USERS:' + users)
    console.log('COUNT_SCHOOLS:' + schools)
    console.log('COUNT_CLASSES:' + classes)
    console.log('COUNT_STUDENTS:' + students)
    console.log('COUNT_FEES:' + feeStructures)
    console.log('COUNT_INVOICES:' + invoices)
    console.log('COUNT_PAYMENTS:' + payments)

    const schools_list = await prisma.school.findMany({ select: { name: true } })
    console.log('SCHOOLS_LIST:' + JSON.stringify(schools_list.map(s => s.name)))
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
