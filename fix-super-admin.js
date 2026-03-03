const { PrismaClient } = require('@prisma/client')
const { hash } = require('bcryptjs')

const prisma = new PrismaClient()
const SUPER_ADMIN_EMAIL = 'garnet@paydesk.co.ke'
const NEW_PASSWORD = 'garnet123'

async function main() {
    console.log('🔍 Checking super admin accounts...')
    console.log(`   Connected to: ${process.env.DATABASE_URL?.slice(0, 50)}...\n`)

    const superAdmins = await prisma.user.findMany({
        where: { role: 'SUPER_ADMIN' },
        select: { id: true, email: true, isActive: true, requiresPasswordChange: true }
    })

    if (superAdmins.length === 0) {
        console.log('⚠️  No SUPER_ADMIN users found — creating...')
    } else {
        console.log(`Found ${superAdmins.length} super admin(s):`)
        superAdmins.forEach(u => {
            console.log(`  • ${u.email} | active=${u.isActive} | requiresPwdChange=${u.requiresPasswordChange}`)
        })
    }

    const hashedPassword = await hash(NEW_PASSWORD, 12)

    const admin = await prisma.user.upsert({
        where: { email: SUPER_ADMIN_EMAIL },
        update: {
            password: hashedPassword,
            isActive: true,
            requiresPasswordChange: false,
            termsAccepted: true,
        },
        create: {
            email: SUPER_ADMIN_EMAIL,
            password: hashedPassword,
            role: 'SUPER_ADMIN',
            firstName: 'Garnet',
            lastName: 'Administrator',
            phoneNumber: '254748938887',
            isActive: true,
            requiresPasswordChange: false,
            termsAccepted: true,
        }
    })

    console.log(`\n✅ Super admin ready!`)
    console.log(`   Email:    ${admin.email}`)
    console.log(`   Password: ${NEW_PASSWORD}`)
    console.log(`   ID:       ${admin.id}`)
}

main()
    .catch(e => { console.error('❌ Error:', e.message); process.exit(1) })
    .finally(() => prisma.$disconnect())
