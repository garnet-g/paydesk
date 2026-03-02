import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const user = await prisma.user.update({
            where: { email: session.user.email },
            data: {
                termsAccepted: true,
                termsAcceptedAt: new Date(),
            },
        })

        return NextResponse.json({ success: true, termsAccepted: user.termsAccepted })
    } catch (error) {
        console.error('Error accepting terms:', error)
        return NextResponse.json(
            { error: 'Internal server error while accepting terms' },
            { status: 500 }
        )
    }
}
