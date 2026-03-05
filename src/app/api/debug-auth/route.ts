import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        const userCount = await prisma.user.count()
        const users = await prisma.user.findMany({
            select: { email: true, role: true },
            take: 5
        })
        return NextResponse.json({
            userCount,
            users,
            env: {
                DATABASE_URL_PREFIX: process.env.DATABASE_URL?.substring(0, 15),
                NODE_ENV: process.env.NODE_ENV
            }
        })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
