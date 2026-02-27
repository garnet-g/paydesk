import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
    const session = await getServerSession(authOptions)

    // Strictly strictly Super Admin
    if (!session || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const users = await prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                school: {
                    select: {
                        name: true
                    }
                }
            }
        })

        // Clean out passwords before returning to frontend
        const safeUsers = users.map(user => {
            const { password, ...safeUser } = user
            return safeUser
        })

        return NextResponse.json(safeUsers)
    } catch (error: any) {
        console.error('Failed to fetch platform users:', error)
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}
