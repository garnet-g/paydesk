import { compare, hash } from 'bcryptjs'
import { prisma } from '../src/lib/prisma'

async function main() {
    const email = 'principal@test.local'
    const password = 'password123'

    const user = await prisma.user.findUnique({
        where: { email }
    })

    if (!user) {
        console.log('User not found')
        return
    }

    console.log('User found. Hash:', user.password)

    const isValid = await compare(password, user.password)
    console.log('Is password valid?', isValid)

    // Test a fresh hash
    const freshHash = await hash(password, 10)
    console.log('Freshly hashed password:', freshHash)
    const isFreshValid = await compare(password, freshHash)
    console.log('Is fresh hash valid?', isFreshValid)
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
