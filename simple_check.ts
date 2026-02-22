
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
    const s = await prisma.student.count();
    const f = await prisma.feeStructure.count();
    const p = await prisma.user.count({ where: { role: 'PARENT' } });
    const sc = await prisma.school.count();
    console.log(`STATS: STUDENTS=${s}, FEES=${f}, PARENTS=${p}, SCHOOLS=${sc}`);
}
main().finally(() => prisma.$disconnect());
