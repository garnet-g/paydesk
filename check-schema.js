// Check which columns exist in production for the User table
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    console.log('🔍 Checking production DB schema for User table...\n')

    // Try fetching a user with ALL fields that our Prisma schema declares
    try {
        const user = await prisma.user.findUnique({
            where: { email: 'garnet@paydesk.co.ke' },
        })
        console.log('✅ Full user object keys:', Object.keys(user || {}))
        console.log('   termsAccepted:', user?.termsAccepted)
        console.log('   termsAcceptedAt:', user?.termsAcceptedAt)
    } catch (e) {
        console.log('❌ Full fetch error:', e.message)
    }

    // Check what columns the DB actually has
    const result = await prisma.$queryRaw`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'User'
        ORDER BY ordinal_position
    `
    console.log('\n📋 Actual DB columns for User table:')
    result.forEach(col => {
        console.log(`   ${col.column_name} | ${col.data_type} | nullable=${col.is_nullable}`)
    })
}

main()
    .catch(e => { console.error('❌ Fatal:', e.message); process.exit(1) })
    .finally(() => prisma.$disconnect())
