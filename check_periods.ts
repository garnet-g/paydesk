
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
    const periods = await prisma.academicPeriod.findMany({
        select: { academicYear: true, term: true, isActive: true, schoolId: true }
    })
    console.log('ACADEMIC_PERIODS:' + JSON.stringify(periods))
}
main().finally(() => prisma.$disconnect());
