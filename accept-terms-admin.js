const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
    // Update super admin to have terms accepted (prevents consent modal blocking)
    const updated = await prisma.user.update({
        where: { email: 'garnet@paydesk.co.ke' },
        data: { termsAccepted: true, termsAcceptedAt: new Date() },
        select: { email: true, termsAccepted: true, isActive: true }
    })
    console.log('✅ Super admin updated:', updated)
}

main()
    .catch(e => { console.error('❌', e.message); process.exit(1) })
    .finally(() => prisma.$disconnect())
