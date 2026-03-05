import { config } from 'dotenv'
config({ path: '.env.production' })

import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

process.env.DATABASE_URL = "postgresql://postgres.qtlwyqdczntathepnpzd:Snowbow%40990@aws-1-eu-west-2.pooler.supabase.com:5432/postgres"

const prisma = new PrismaClient()

async function main() {
    let school = await prisma.school.findFirst()
    if (!school) {
        school = await prisma.school.create({
            data: {
                name: 'Local Dev School',
                code: 'LDS',
            }
        })
        console.log('Created a dummy school.')
    }

    const roles = ['SUPER_ADMIN', 'PRINCIPAL', 'FINANCE_MANAGER', 'TEACHER', 'PARENT']
    const password = await bcrypt.hash('password123', 10)

    console.log('--- TEST LOGINS ---')

    for (const role of roles) {
        const email = `${role.toLowerCase()}@test.local`
        let user = await prisma.user.findUnique({ where: { email } })

        if (!user) {
            user = await prisma.user.create({
                data: {
                    email,
                    password,
                    role,
                    firstName: 'Test',
                    lastName: role,
                    schoolId: school.id,
                }
            })
            console.log(`Role: ${role}\nEmail: ${email}\nPassword: password123\n`)
        } else {
            await prisma.user.update({
                where: { email },
                data: { password, schoolId: school.id }
            })
            console.log(`Role: ${role}\nEmail: ${email}\nPassword: password123\n(Updated existing user)\n`)
        }
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
