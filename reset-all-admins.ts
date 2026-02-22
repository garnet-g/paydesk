import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    const password = 'admin123'
    const hashedPassword = await hash(password, 10)

    // Try multiple possible emails or patterns
    const admins = await (prisma.user as any).findMany({
        where: {
            OR: [
                { email: { contains: 'admin' } },
                { role: 'SUPER_ADMIN' }
            ]
        }
    })

    if (admins.length === 0) {
        console.log('No admin users found.')
        return
    }

    for (const admin of admins) {
        await (prisma.user as any).update({
            where: { id: admin.id },
            data: {
                password: hashedPassword,
                requiresPasswordChange: false
            }
        })
        console.log(`Updated password for: ${admin.email}`)
    }
}

main().finally(() => prisma.$disconnect())
