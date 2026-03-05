import { config } from 'dotenv'
const result = config({ path: '.env.development' })
console.log('Dotenv Load Result:', result.parsed ? 'Success' : 'Failure')

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Using DATABASE_URL:', process.env.DATABASE_URL)

    try {
        const users = await prisma.user.findMany({
            select: {
                email: true,
                role: true
            }
        })
        console.log('Users in database:', users)
    } catch (e: any) {
        console.error('Error fetching users:', e.message)
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
