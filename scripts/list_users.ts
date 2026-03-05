import { prisma } from '../src/lib/prisma'

async function main() {
    const users = await prisma.user.findMany({
        select: {
            email: true,
            role: true
        }
    })
    console.log('--- Current Users in Active DB ---')
    users.forEach(u => console.log(`${u.role}: ${u.email}`))
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
