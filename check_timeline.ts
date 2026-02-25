import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
    // Show all migrations with timestamps to see when the DB was set up
    const migrations = await prisma.$queryRaw`SELECT migration_name, started_at, finished_at FROM "_prisma_migrations" ORDER BY started_at ASC` as any[]
    console.log(`\n=== MIGRATION HISTORY (${migrations.length} total) ===`)
    migrations.forEach((m: any) => {
        console.log(`  ${m.started_at}  →  ${m.migration_name}`)
    })

    // Show earliest record in the DB (when was data first inserted?)
    const firstSchool = await prisma.school.findFirst({ orderBy: { createdAt: 'asc' } })
    const firstUser = await prisma.user.findFirst({ orderBy: { createdAt: 'asc' } })
    console.log(`\nOldest school: ${firstSchool?.name} created at ${firstSchool?.createdAt}`)
    console.log(`Oldest user:   ${firstUser?.email} created at ${firstUser?.createdAt}`)

    // List all students
    const students = await prisma.student.findMany({
        include: { school: { select: { name: true } } },
        orderBy: { createdAt: 'asc' }
    })
    console.log(`\n=== ALL STUDENTS (${students.length}) ===`)
    students.forEach(s => {
        console.log(`  ${s.firstName} ${s.lastName} (${s.admissionNumber}) – ${s.school.name} – created ${s.createdAt}`)
    })
}
main()
    .catch(e => console.error('ERROR:', e.message))
    .finally(() => prisma.$disconnect())
