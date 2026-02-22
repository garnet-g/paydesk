
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const schools = await prisma.school.findMany({
        where: {
            logoUrl: {
                startsWith: 'data:image'
            }
        },
        select: { id: true, name: true, logoUrl: true }
    })

    console.log(`Found ${schools.length} schools with Base64 logos.`)

    for (const school of schools) {
        console.log(`Cleaning up logo for: ${school.name}`)
        await prisma.school.update({
            where: { id: school.id },
            data: { logoUrl: null }
        })
    }

    console.log('Cleanup complete.')
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
