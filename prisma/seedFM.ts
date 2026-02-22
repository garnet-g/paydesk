import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    const school = await prisma.school.findUnique({ where: { code: 'DEMO001' } })
    if (!school) return

    const fm = await prisma.user.upsert({
        where: { email: 'finance@demoschool.ac.ke' },
        update: {},
        create: {
            email: 'finance@demoschool.ac.ke',
            password: await hash('password123', 12),
            role: 'FINANCE_MANAGER',
            firstName: 'Finance',
            lastName: 'Manager',
            phoneNumber: '254733333333',
            schoolId: school.id,
            requiresPasswordChange: false,
        } as any,
    })
    console.log('✅ Created Finance Manager:', fm.email)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
