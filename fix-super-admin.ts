/**
 * Fix Super Admin Login Script
 * Run with: npx ts-node --project tsconfig.json fix-super-admin.ts
 * 
 * This script:
 * 1. Lists all SUPER_ADMIN users and their status
 * 2. Resets passwords and ensures accounts are active
 * 3. Creates the super admin if it doesn't exist
 */
import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient({
    datasources: {
        db: {
            // Override to use the production URL from env
            url: process.env.DATABASE_URL
        }
    }
})

const SUPER_ADMIN_EMAIL = 'garnet@paydesk.co.ke'
const NEW_PASSWORD = 'garnet123'

async function main() {
    console.log('🔍 Checking super admin accounts...\n')
    console.log(`   DATABASE_URL starts with: ${process.env.DATABASE_URL?.slice(0, 30)}...\n`)

    // List all super admins
    const superAdmins = await prisma.user.findMany({
        where: { role: 'SUPER_ADMIN' },
        select: { id: true, email: true, isActive: true, requiresPasswordChange: true, firstName: true, lastName: true }
    })

    if (superAdmins.length === 0) {
        console.log('⚠️  No SUPER_ADMIN users found in DB — creating one...')
    } else {
        console.log(`Found ${superAdmins.length} super admin(s):`)
        superAdmins.forEach(u => {
            console.log(`  • ${u.email} | active=${u.isActive} | requiresPwdChange=${u.requiresPasswordChange}`)
        })
    }

    const hashedPassword = await hash(NEW_PASSWORD, 12)

    // Upsert the main super admin
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
        } as any
    })

    console.log(`\n✅ Super admin fixed!`)
    console.log(`   Email:    ${admin.email}`)
    console.log(`   Password: ${NEW_PASSWORD}`)
    console.log(`   Active:   ${admin.isActive}`)
    console.log(`   Requires password change: ${admin.requiresPasswordChange}`)
}

main()
    .catch(e => {
        console.error('❌ Error:', e.message)
        process.exit(1)
    })
    .finally(() => prisma.$disconnect())
