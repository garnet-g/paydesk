const { PrismaClient } = require('@prisma/client')
const { compare, hash } = require('bcryptjs')

const prisma = new PrismaClient()
const SUPER_ADMIN_EMAIL = 'garnet@paydesk.co.ke'
const TEST_PASSWORD = 'garnet123'

async function main() {
    console.log('🔍 Diagnosing super admin login...\n')

    // 1. Fetch the user with all fields
    const user = await prisma.user.findUnique({
        where: { email: SUPER_ADMIN_EMAIL },
        select: {
            id: true,
            email: true,
            role: true,
            isActive: true,
            requiresPasswordChange: true,
            password: true,
            schoolId: true,
        }
    })

    if (!user) {
        console.log('❌ User NOT FOUND in database!')
        return
    }

    console.log('✅ User found:')
    console.log(`   ID:       ${user.id}`)
    console.log(`   Email:    ${user.email}`)
    console.log(`   Role:     ${user.role}`)
    console.log(`   Active:   ${user.isActive}`)
    console.log(`   SchoolId: ${user.schoolId}`)
    console.log(`   RequiresPwdChange: ${user.requiresPasswordChange}`)
    console.log(`   Password hash (first 20): ${user.password?.slice(0, 20)}...`)

    // 2. Test password
    const isValid = await compare(TEST_PASSWORD, user.password)
    console.log(`\n🔐 Password "${TEST_PASSWORD}" matches: ${isValid}`)

    if (!isValid) {
        console.log('\n🔧 Password mismatch — resetting now...')
        const hashedPassword = await hash(TEST_PASSWORD, 12)
        await prisma.user.update({
            where: { email: SUPER_ADMIN_EMAIL },
            data: {
                password: hashedPassword,
                isActive: true,
                requiresPasswordChange: false,
            }
        })
        console.log(`✅ Password reset to: ${TEST_PASSWORD}`)
    } else {
        console.log('\n✅ Password is correct — login should work.')
        console.log('   If login still fails, the issue may be:')
        console.log('   - NEXTAUTH_SECRET mismatch between local & production?')
        console.log('   - AuditLog schoolId foreign key issue (schoolId is null)')

        // 3. Test audit log creation (what auth.ts does)
        try {
            const testLog = await prisma.auditLog.create({
                data: {
                    action: 'LOGIN_TEST',
                    entityType: 'User',
                    entityId: user.id,
                    userId: user.id,
                    schoolId: user.schoolId, // null for super admin
                }
            })
            console.log(`\n✅ AuditLog creation with null schoolId: OK (id=${testLog.id})`)
            // Clean up test log
            await prisma.auditLog.delete({ where: { id: testLog.id } })
        } catch (e) {
            console.log(`\n❌ AuditLog creation FAILED: ${e.message}`)
            console.log('   → THIS is why super admin login fails!')
        }
    }
}

main()
    .catch(e => { console.error('❌ Fatal error:', e.message); process.exit(1) })
    .finally(() => prisma.$disconnect())
