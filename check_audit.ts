import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
    // Check audit log for any DELETE/RESET actions
    const auditLogs = await (prisma as any).auditLog.findMany({
        where: {
            OR: [
                { action: { contains: 'DELETE' } },
                { action: { contains: 'RESET' } },
                { action: { contains: 'SEED' } },
                { action: { contains: 'MIGRATE' } },
                { action: { contains: 'DROP' } },
            ]
        },
        orderBy: { createdAt: 'desc' },
        take: 30
    })
    console.log(`Destructive audit entries found: ${auditLogs.length}`)
    auditLogs.forEach((log: any) => {
        console.log(`  [${log.createdAt}] ${log.action} - ${log.entityType} - ${log.details}`)
    })

    // Check migration history from prisma migrations table
    const migrations = await prisma.$queryRaw`SELECT * FROM "_prisma_migrations" ORDER BY started_at ASC` as any[]
    console.log(`\nMigrations (${migrations.length} total):`)
    migrations.forEach((m: any) => {
        console.log(`  ${m.started_at?.toISOString?.() ?? m.started_at}  →  ${m.migration_name}`)
    })
}
main()
    .catch(e => console.error('ERROR:', e.message))
    .finally(() => prisma.$disconnect())
