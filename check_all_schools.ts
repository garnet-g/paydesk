import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
    const schools = await prisma.school.findMany({
        include: {
            _count: {
                select: {
                    students: true,
                    users: true,
                    invoices: true,
                    payments: true,
                }
            }
        },
        orderBy: { createdAt: 'asc' }
    })
    console.log(`\n=== TOTAL SCHOOLS IN SUPABASE: ${schools.length} ===\n`)
    schools.forEach(s => {
        console.log(`🏫  ${s.name} (Code: ${s.code})`)
        console.log(`    Created: ${s.createdAt}`)
        console.log(`    Students: ${s._count.students} | Users: ${s._count.users} | Invoices: ${s._count.invoices} | Payments: ${s._count.payments}`)
        console.log()
    })

    const users = await prisma.user.findMany({
        select: { email: true, role: true, school: { select: { name: true } } },
        orderBy: { createdAt: 'asc' }
    })
    console.log(`=== TOTAL USERS IN SUPABASE: ${users.length} ===\n`)
    users.forEach(u => {
        console.log(`  [${u.role}] ${u.email}  →  ${u.school?.name ?? 'No school'}`)
    })
}
main()
    .catch(e => console.error('ERROR:', e))
    .finally(() => prisma.$disconnect())
