import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
    const users = await prisma.user.findMany({
        where: {
            role: 'PRINCIPAL',
            school: {
                name: { contains: 'brookehouse', mode: 'insensitive' }
            }
        },
        select: { email: true, firstName: true, lastName: true, school: { select: { name: true } } }
    })
    console.log(users)
}
main().finally(() => prisma.$disconnect())
