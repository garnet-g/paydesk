const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const student = await prisma.student.findFirst({
        where: { firstName: 'faith' }
    });

    const parent = await prisma.user.findFirst({
        where: { email: 'maryw@usiu.com' }
    });

    if (!student || !parent) {
        console.log('Student or Parent not found');
        return;
    }

    console.log(`Attempting to link ${student.firstName} to ${parent.email}...`);

    try {
        const result = await prisma.$transaction(async (tx) => {
            // Clear existing
            await tx.studentGuardian.deleteMany({
                where: { studentId: student.id, isPrimary: true }
            });

            // Link
            return await tx.studentGuardian.create({
                data: {
                    studentId: student.id,
                    userId: parent.id,
                    relationship: 'Guardian',
                    isPrimary: true
                }
            });
        });
        console.log('SUCCESS:', result);
    } catch (err) {
        console.error('FAILED:', err);
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
