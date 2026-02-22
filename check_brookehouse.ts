import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const schools = await prisma.school.findMany({
        where: {
            name: {
                contains: 'brookehouse',
                mode: 'insensitive'
            }
        },
        include: {
            users: {
                where: {
                    role: 'PRINCIPAL'
                }
            }
        }
    })

    console.log(JSON.stringify(schools, null, 2))
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
