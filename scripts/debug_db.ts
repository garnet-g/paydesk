import { prisma } from '../src/lib/prisma'

async function main() {
    console.log('Runtime DATABASE_URL check...')
    try {
        const userCount = await prisma.user.count()
        console.log('Total users in database:', userCount)

        const firstUser = await prisma.user.findFirst()
        console.log('First user email:', firstUser?.email || 'None')
    } catch (e: any) {
        console.error('Database connection error:', e.message)
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
