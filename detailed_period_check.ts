
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
    const periods = await prisma.academicPeriod.findMany({
        include: { school: { select: { name: true } } }
    })
    periods.forEach(p => {
        console.log(`Period: ${p.academicYear} ${p.term} - School: ${p.school.name} (Active: ${p.isActive})`)
    })
}
main().finally(() => prisma.$disconnect());
