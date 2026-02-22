
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
    const schools = await prisma.school.findMany({
        include: {
            _count: {
                select: {
                    students: true,
                    feeStructures: true,
                    users: true,
                }
            }
        }
    })
    console.log('--- SCHOOL DATA ---')
    schools.forEach(s => {
        console.log(`School: ${s.name} (${s.code})`)
        console.log(` - Students: ${s._count.students}`)
        console.log(` - Fees: ${s._count.feeStructures}`)
        console.log(` - Users: ${s._count.users}`)
    })
}
main().finally(() => prisma.$disconnect());
