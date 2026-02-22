
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
    const users = await prisma.user.findMany({
        select: { email: true, role: true, school: { select: { name: true } } }
    })
    users.forEach(u => {
        console.log(`User: ${u.email} | Role: ${u.role} | School: ${u.school?.name || 'Global'}`)
    })
}
main().finally(() => prisma.$disconnect());
