import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    const email = 'admin@schoolbilling.ke'
    const newPassword = 'admin123'
    const hashedPassword = await hash(newPassword, 10)

    try {
        const user = await (prisma.user as any).update({
            where: { email },
            data: {
                password: hashedPassword,
                requiresPasswordChange: false
            }
        })
        console.log(`Password reset successful for: ${user.email}`)
    } catch (error) {
        console.error('Error resetting password. Admin user not found with that email.')
        // List users to help find the right one
        const users = await prisma.user.findMany({ select: { email: true, role: true } })
        console.log('Available users:', users)
    } finally {
        await prisma.$disconnect()
    }
}

main()
