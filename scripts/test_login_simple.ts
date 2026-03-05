import { compare, hash } from 'bcryptjs'
import { prisma } from '../src/lib/prisma'

async function main() {
    const email = 'principal@test.local'
    const password = 'password123'

    const user = await prisma.user.findUnique({
        where: { email }
    })

    if (!user) {
        process.stdout.write('USER_NOT_FOUND\n')
        return
    }

    const isValid = await compare(password, user.password)
    process.stdout.write(`IS_VALID: ${isValid}\n`)
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
