import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
    const users = await prisma.user.findMany({
        where: { role: 'PRINCIPAL', school: { name: { contains: 'brookehouse', mode: 'insensitive' } } },
    })
    users.forEach(u => console.log(`EMAIL: ${u.email} | NAME: ${u.firstName} ${u.lastName}`))
}
main().finally(() => prisma.$disconnect())
