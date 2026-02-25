import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const userCount = await prisma.user.count()
    const schoolCount = await prisma.school.count()
    console.log(`Users in DB: ${userCount}`)
    console.log(`Schools in DB: ${schoolCount}`)

    if (userCount > 0) {
        const users = await prisma.user.findMany({ take: 5 })
        console.log('Sample Users:', users.map(u => u.email))
    }

    if (schoolCount > 0) {
        const schools = await prisma.school.findMany({ take: 5 })
        console.log('Sample Schools:', schools.map(s => s.name))
    }
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect())
